import * as puppeteer from 'puppeteer-core';
import { Page, Browser, Response, SetCookie } from 'puppeteer-core';
import { Cookie } from 'tough-cookie';
import { BrowserOptions } from './interfaces';

export type BrowserConsoleMessage = {
    type: string;
    text: string;
    source: puppeteer.ConsoleMessage;
}

export interface iBrowserControlResponse {
    response: Response
    body: string,
    cookies: Cookie[]
}

export class BrowserControl {

    private _opts: BrowserOptions = {};
    private _browser: Browser | null = null;
    private _page: Page | null = null;
    private _response: Response | null = null;
    private _consoleMessages: BrowserConsoleMessage[] = [];
    private _puppeteer: typeof puppeteer | null = null;

    public get consoleMessages(): BrowserConsoleMessage[] {
        return this._consoleMessages;
    }

    public get opts(): BrowserOptions {
        return this._opts;
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

    private get _dynamicPuppeteer(): Promise<typeof puppeteer> {
        if (!this._puppeteer) {
            // Try importing puppeteer.
            return import('puppeteer')
                .then(newPuppeteer => {
                    this._puppeteer = newPuppeteer;
                    // Return our imported puppeteer.
                    return this._puppeteer;
                })
                // If puppeteer could not be loaded then load core.
                .catch((e) => {
                    this._puppeteer = puppeteer;
                    // Fallback to our current import.
                    return this._puppeteer;
                });
        }
        return Promise.resolve(this._puppeteer);
    }

    public async getCookies(): Promise<Cookie[]> {
        if (this._page === null) {
            throw new Error('Page is null');
        }
        const puppeteerCookies: puppeteer.Cookie[] = await this._page.cookies();
        const cookies: Cookie[] = [];
        puppeteerCookies.forEach(puppeteerCookie => {
            cookies.push(new Cookie({
                key: puppeteerCookie.name,
                value: puppeteerCookie.value,
                domain: puppeteerCookie.domain,
                path: puppeteerCookie.path,
                httpOnly: puppeteerCookie.httpOnly,
                secure: puppeteerCookie.secure
            }));
        });
        return cookies;
    }

    public async close(): Promise<void> {
        if (this._page !== null) {
            await this._page.close();
        }
    }

    public has404(): boolean {
        return this._find404Errors().length > 0;
    }

    public open(opts: BrowserOptions): Promise<iBrowserControlResponse> {
        this._opts = opts;
        // Must have a uri
        if (typeof this._opts.uri == 'undefined') {
            throw new Error('Must have a URL to load.');
        }
        return new Promise(resolve => {
            this._dynamicPuppeteer
                .then(async (puppeteer) => {
                    // Hoist width/height into defaultViewport if not already set
                    this._opts.defaultViewport = this._opts.defaultViewport || {};
                    this._opts.defaultViewport.width = this._opts.defaultViewport.width || this._opts.width || 800;
                    this._opts.defaultViewport.height = this._opts.defaultViewport.height || this._opts.width || 600;
                    // Need some default args
                    this._opts.args = this._opts.args || [];
                    this._opts.args.push('--no-sandbox');
                    this._opts.args.push('--disable-setuid-sandbox');
                    // Start up the browser
                    this._browser = await puppeteer.launch(this._opts);
                    this._page = await this._onBrowserReady(this._browser);
                    this._recordConsoleOutput();
                    this._applyCookies();
                    resolve({
                        response: await this._openUri(),
                        body: await this._page.content(),
                        cookies: await this.getCookies()
                    });
                });
        });
    }

    private async _onBrowserReady(browser: puppeteer.Browser): Promise<puppeteer.Page> {
        const pages: Page[] = await browser.pages();
        return pages.length > 0 ? pages[0] : await browser.newPage();
    }

    private _recordConsoleOutput() {
        if (this._opts.recordConsole && this._page !== null) {
            this._page.on('console', (consoleMesssage: puppeteer.ConsoleMessage) => {
                if (this._opts.outputConsole) {
                    console.log(`Console: ${consoleMesssage.type().toUpperCase()} - ${consoleMesssage.text()}`);
                }
                this._consoleMessages.push({
                    type: consoleMesssage.type(),
                    text: consoleMesssage.text(),
                    source: consoleMesssage
                });
            });
        }
    }

    private _applyCookies() {
        if (typeof this._opts.jar != 'undefined' && this._page !== null) {
            this._opts.jar.getCookies(
                this._opts.uri || '/',
                {},
                (err: Error | null, cookies: Cookie[]) => {
                    // If there was an error
                    if (err !== null || this._page === null) {
                        throw err;
                    }
                    // If not then apply these cookies
                    const puppeteerCookies: SetCookie[] = [];
                    cookies.forEach((cookie: Cookie) => {
                        puppeteerCookies.push({
                            name: cookie.key,
                            value: cookie.value,
                            url: this._opts.uri,
                            domain: cookie.domain || undefined,
                            path: cookie.path || '/',
                            secure: cookie.secure,
                            httpOnly: cookie.httpOnly
                        })
                    });
                    this._page.setCookie(...puppeteerCookies);
                }
            );
        }
    }

    private async _openUri(): Promise<Response> {
        if (this._page === null) {
            throw new Error('Page is null.');
        }
        const response: Response | null = await this._page.goto(
            this._opts.uri || '/',
            {
                timeout: 30000,
                waitUntil: 'networkidle2'
            }
        );
        if (response === null) {
            throw new Error('Browser response is null.');
        }
        this._response = response;
        return response;
    }

    // TODO: We might be better detecting 404s with .on('response')
    // See- https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-response
    private _find404Errors(): BrowserConsoleMessage[] {
        return this._consoleMessages
            .filter((consoleMessage) => {
                const text: string = consoleMessage.text;
                return text.indexOf('404 (Not Found)') > -1;
            });
    }

}