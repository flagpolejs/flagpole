import * as puppeteer from "puppeteer-core";
import { CookieJar } from 'request';
import { ElementHandle } from 'puppeteer-core';
import { Cookie } from 'tough-cookie';

export class Browser {

    private opts: BrowserOptions = {};
    private page: puppeteer.Page | null = null;
    private consoleMessages: ConsoleMessage[] = [];
    private puppeteer: typeof puppeteer | null = null;

    private get dynamicPuppeteer(): Promise<typeof puppeteer> {
        if (!this.puppeteer) {
            // Try importing puppeteer.
            return import('puppeteer')
                .then(newPuppeteer => {
                    this.puppeteer = newPuppeteer;
                    // Return our imported puppeteer.
                    return this.puppeteer;
                })
                // If puppeteer could not be loaded then load core.
                .catch((e) => {
                    this.puppeteer = puppeteer;
                    // Fallback to our current import.
                    return this.puppeteer;
                });
        }
        return Promise.resolve(this.puppeteer);
    }

    public open(opts: BrowserOptions) {
        const browser = this;
        browser.opts = opts;
        return this.dynamicPuppeteer
            .then((puppeteer) => {
                // Set default options
                const launchOptions = {
                    ignoreHTTPSErrors: true,
                    headless: browser.opts.headless,
                    defaultViewport: {
                        width: browser.opts.width || 800,
                        height: browser.opts.height || 600,
                    },
                };
                // Copy any puppeteerLaunchOptions to our launchOptions.
                if (browser.opts.puppeteerLaunchOptions) {
                    Object.assign(launchOptions, browser.opts.puppeteerLaunchOptions);
                }
                // Start up the browser
                return puppeteer.launch(launchOptions)
                    .then(this.onBrowserReady)
                    .then((page: puppeteer.Page) => {
                        return this.onPageReady(browser, page);
                    })
                    .then((response: puppeteer.Response) => {
                        return this.onResponse(browser, response);
                    });
            });
    }

    public async select(selector: string): Promise<ElementHandle<Element>[]> {
        if (this.page === null) {
            throw 'Page not loaded'
        }
        return await this.page.$$(selector);
    }

    private onBrowserReady(browser: puppeteer.Browser): Promise<puppeteer.Page> {
        // Ensure the browser opens with a page.
        return browser.pages()
            .then((pages) => {
                return (pages.length > 0) ?
                    pages[0] : browser.newPage();
            });
    }

    private async onPageReady(browser: Browser, page: puppeteer.Page): Promise<puppeteer.Response> {
        browser.page = page;
        // Must have a uri
        if (typeof browser.opts.uri == 'undefined') {
            throw 'Must have a URL to load.';
        }
        // Record browser console output
        if (browser.opts.recordConsole) {
            page.on('console', (consoleMesssage: puppeteer.ConsoleMessage) => {
                if (browser.opts.outputConsole) {
                    console.log(`Console: ${consoleMesssage.type().toUpperCase()} - ${consoleMesssage.text()}`);
                }
                browser.consoleMessages.push({
                    type: consoleMesssage.type(),
                    text: consoleMesssage.text(),
                    source: consoleMesssage
                });
            });
        }
        // Set cookies
        if (typeof browser.opts.jar != 'undefined') {
            let cookies: puppeteer.SetCookie[] = [];
            browser.opts.jar.getCookies(browser.opts.uri).forEach((cookie: Cookie) => {
                cookies.push({
                    name: cookie.key,
                    value: cookie.value,
                    domain: cookie.domain || undefined,
                    path: cookie.path || '/',
                    httpOnly: cookie.httpOnly,
                    secure: cookie.secure
                });
            });
            page.setCookie(...cookies);
        }
        // Open page
        return page.goto(
                browser.opts.uri,
                { waitUntil: 'networkidle2' }
            )
            .then((response) => {
                return <puppeteer.Response> response;
            });
    }

    private onResponse(browser: Browser, response: puppeteer.Response): Promise<{ response: puppeteer.Response; body: string; }> {
        const page: puppeteer.Page | null = browser.page;
        if (page !== null) {
            return page.content()
                .then((body: string) => {
                    return {
                        response: response,
                        body: body,
                    };
                });
        }
        throw 'No response';
    }

    private getConsoleMessages(): ConsoleMessage[] {
        return this.consoleMessages;
    }

    public has404(): boolean {
        return this.find404Errors().length > 0;
    }

    // TODO: We might be better detecting 404s with .on('response')
    // See- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-response
    private find404Errors(): ConsoleMessage[] {
        return this.getConsoleMessages()
            .filter((consoleMessage) => {
                const text: string = consoleMessage.text;
                return text.indexOf('404 (Not Found)') > -1;
            });
    }

    public getPage(): puppeteer.Page | null {
        return this.page;
    }

}

export type ConsoleMessage = {
    type: string;
    text: string;
    source: puppeteer.ConsoleMessage;
};

export interface BrowserOptions {
    uri?: string;
    jar?: CookieJar;
    headless?: boolean;
    recordConsole?: boolean;
    outputConsole?: boolean;
    width?: number;
    height?: number;
    puppeteerLaunchOptions?: puppeteer.LaunchOptions;
};
