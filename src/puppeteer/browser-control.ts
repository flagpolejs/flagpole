import * as puppeteer from "puppeteer-core";
import { Page, Browser, Response, SetCookie } from "puppeteer-core";
import { HttpRequest } from "../http-request";
import { BrowserOptions, KeyValue } from "../interfaces";

export type BrowserConsoleMessage = {
  type: string;
  text: string;
  source: puppeteer.ConsoleMessage;
};

export interface iBrowserControlResponse {
  response: Response;
  body: string;
  cookies: KeyValue;
}

export class BrowserControl {
  private _request: HttpRequest = new HttpRequest({});
  private _browser: Browser | null = null;
  private _page: Page | null = null;
  private _response: Response | null = null;
  private _consoleMessages: BrowserConsoleMessage[] = [];
  private _puppeteer: typeof puppeteer | null = null;

  public get consoleMessages(): BrowserConsoleMessage[] {
    return this._consoleMessages;
  }

  public get response(): Response | null {
    return this._response;
  }

  public get page(): Page | null {
    return this._page;
  }

  public get browser(): Browser | null {
    return this._browser;
  }

  public get puppeteer(): typeof puppeteer | null {
    return this._puppeteer;
  }

  public get request(): HttpRequest {
    return this._request;
  }

  public get browserOpts(): BrowserOptions {
    return this._request.browser;
  }

  private get _dynamicPuppeteer(): Promise<typeof puppeteer> {
    if (!this._puppeteer) {
      // Try importing puppeteer.
      return (
        import("puppeteer")
          .then((newPuppeteer) => {
            this._puppeteer = newPuppeteer;
            // Return our imported puppeteer.
            return this._puppeteer;
          })
          // If puppeteer could not be loaded then load core.
          .catch((e) => {
            this._puppeteer = puppeteer;
            // Fallback to our current import.
            return this._puppeteer;
          })
      );
    }
    return Promise.resolve(this._puppeteer);
  }

  private async _getCookies(): Promise<KeyValue> {
    if (this._page === null) {
      throw new Error("Page is null");
    }
    const puppeteerCookies: puppeteer.Cookie[] = await this._page.cookies();
    const cookies: KeyValue = {};
    puppeteerCookies.forEach((puppeteerCookie) => {
      cookies[puppeteerCookie.name] = puppeteerCookie.value;
    });
    return cookies;
  }

  public async close(): Promise<void> {
    if (this._page !== null && this._browser !== null) {
      await this._page.close();
      await this._browser.close();
    }
  }

  public has404(): boolean {
    return this._find404Errors().length > 0;
  }

  public open(request: HttpRequest): Promise<iBrowserControlResponse> {
    this._request = request;
    // Must have a uri
    if (typeof this.request.uri == "undefined") {
      throw new Error("Must have a URL to load.");
    }
    return new Promise((resolve, reject) => {
      this._dynamicPuppeteer.then(async (puppeteer) => {
        // Hoist width/height into defaultViewport if not already set
        this.browserOpts.defaultViewport =
          this.browserOpts.defaultViewport || {};
        this.browserOpts.defaultViewport.width =
          this.browserOpts.defaultViewport.width ||
          this.browserOpts.width ||
          800;
        this.browserOpts.defaultViewport.height =
          this.browserOpts.defaultViewport.height ||
          this.browserOpts.width ||
          600;
        // Need some default args
        this.browserOpts.args = this.browserOpts.args || [];
        this.browserOpts.args.push("--no-sandbox");
        this.browserOpts.args.push("--disable-setuid-sandbox");
        // Start up the browser
        this._browser = await puppeteer.launch(this.browserOpts);
        this._page = await this._onBrowserReady(this._browser);
        this._recordConsoleOutput();
        Promise.all([this._applyCookies(), this._setBasicAuth()])
          .then(async () => {
            resolve({
              response: await this._openUri(),
              body: this._page ? await this._page.content() : "",
              cookies: await this._getCookies(),
            });
          })
          .catch(reject);
      });
    });
  }

  private async _onBrowserReady(
    browser: puppeteer.Browser
  ): Promise<puppeteer.Page> {
    const pages: Page[] = await browser.pages();
    return pages.length > 0 ? pages[0] : await browser.newPage();
  }

  private _recordConsoleOutput() {
    if (this.browserOpts.recordConsole && this._page !== null) {
      this._page.on("console", (consoleMesssage: puppeteer.ConsoleMessage) => {
        if (this.browserOpts.outputConsole) {
          console.log(
            `Console: ${consoleMesssage
              .type()
              .toUpperCase()} - ${consoleMesssage.text()}`
          );
        }
        this._consoleMessages.push({
          type: consoleMesssage.type(),
          text: consoleMesssage.text(),
          source: consoleMesssage,
        });
      });
    }
  }

  private async _setBasicAuth() {
    if (this._page !== null && this.request.auth) {
      return this._page.authenticate(this.request.auth);
    }
  }

  private async _applyCookies() {
    if (Object.values(this.request.cookies).length && this._page) {
      const tld = this._request.uri
        ? new URL(this._request.uri).hostname.split(".").slice(-2).join(".")
        : undefined;
      const puppeteerCookies: SetCookie[] = Object.keys(
        this.request.cookies
      ).map((key) => {
        return {
          name: key,
          value: this.request.cookies[key],
          domain: `.${tld}`,
        };
      });
      return this._page.setCookie(...puppeteerCookies);
    }
  }

  private async _openUri(): Promise<Response> {
    if (this._page === null) {
      throw new Error("Page is null.");
    }
    const response: Response | null = await this._page.goto(
      this.request.uri || "/",
      {
        timeout: 30000,
        waitUntil: "networkidle2",
      }
    );
    if (response === null) {
      throw new Error("Browser response is null.");
    }
    this._response = response;
    return response;
  }

  // TODO: We might be better detecting 404s with .on('response')
  // See- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-response
  private _find404Errors(): BrowserConsoleMessage[] {
    return this._consoleMessages.filter((consoleMessage) => {
      const text: string = consoleMessage.text;
      return text.indexOf("404 (Not Found)") > -1;
    });
  }
}
