import * as puppeteer from "puppeteer-core";
import { BrowserOptions } from "./scenario";

export class Browser {
    private browserOptions: BrowserOptions = {};
    private browser: puppeteer.Browser | null = null;
    private page: puppeteer.Page | null = null;
    private consoleMessages: ConsoleMessage[] = [];
    private puppeteer: typeof puppeteer | null = null;

    constructor(browserOptions: BrowserOptions) {
        this.browserOptions = browserOptions || {};
    }

    private get dynamicPuppeteer(): Promise<typeof puppeteer> {
        if (!this.puppeteer) {
            // Try importing puppeteer.
            return import('puppeteer').then(newPuppeteer => {
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

    public open(url: string) {
        const browserOptions = this.browserOptions;
        const consoleMessages = this.consoleMessages;

        if (!browserOptions) {
            throw 'No browser options set.';
        }

        return this.dynamicPuppeteer
        .then((puppeteer) => {
            return puppeteer.launch({
                ignoreHTTPSErrors: true,
                headless: browserOptions.headless,
                defaultViewport: {
                    width: browserOptions.width || 800,
                    height: browserOptions.height || 600,
                },
            })
            .then((browser) => {
                this.browser = browser;
    
                // Ensure the browser opens with a page.
                return browser.pages()
                .then((pages) => {
                    if (pages.length > 0) {
                        return pages[0];
                    }
    
                    return browser.newPage();
                });
            })
            .then((page) => {
                this.page = page;
    
                if (browserOptions.recordConsole) {
                    page.on('console', (consoleMesssage: puppeteer.ConsoleMessage) => {
                        if (browserOptions.outputConsole) {
                            console.log(`Console: ${consoleMesssage.type().toUpperCase()} - ${consoleMesssage.text()}`);
                        }
    
                        consoleMessages.push({
                            type: consoleMesssage.type(),
                            text: consoleMesssage.text(),
                            source: consoleMesssage
                        });
                    });
                }
    
                return page.goto(url, { waitUntil: 'networkidle2' })
                .then((response) => {
                    return <puppeteer.Response> response;
                });
            })
            .then((response: puppeteer.Response) => {
                const page: puppeteer.Page | null = this.page;
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
            });
        });
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
