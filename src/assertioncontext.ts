import { Scenario } from './scenario';
import { iResponse, ResponseType } from './response';
import { Suite } from './suite';
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { Assertion } from './assertion';
import { reject } from 'bluebird';

export class AssertionContext {

    private _scenario: Scenario;
    private _response: iResponse;

    private get _isBrowserRequest(): boolean {
        return this._scenario.responseType == ResponseType.browser;
    }

    public result: any;

    public get response(): iResponse {
        return this._response;
    }

    public get scenario(): Scenario {
        return this._scenario;
    }

    public get suite(): Suite {
        return this._scenario.suite;
    }

    public get browser(): Browser | null {
        return this._isBrowserRequest ?
            this._scenario.getBrowser() :
            null;
    }

    public get page(): Page | null {
        const browser = this.browser;
        return browser !== null ?
            browser.getPage() :
            null;
    }

    constructor(scenario: Scenario, response: iResponse) {
        this._scenario = scenario;
        this._response = response;
    }

    public comment(message: string) {
        this._scenario.comment(message);
    }

    public assert(a: any, b?: any): Assertion {
        const statement = typeof b !== 'undefined' ? b : a;
        const message = typeof b !== 'undefined' ? a : undefined;
        return new Assertion(this, statement, message);
    }

    public pause(milliseconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
        });
    }

    public async val(path: string): Promise<string | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const el: ElementHandle<Element> | null = await this.page.$(path);
            if (el !== null) {
                return await this.page.evaluate(el => el.value, el);
            }
        }
        return null;
    }

    public type(path: string, textToType: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            return this.page.type(path, textToType, opts);
        }
        return new Promise((resolve, reject ) => { reject('Can not type into this element.') });;
    }

    public async text(path: string): Promise<string | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const el: ElementHandle<Element> | null = await this.page.$(path);
            if (el !== null) {
                return await this.page.evaluate(el => el.textContent, el);
            }
        }
        return null;
    }

    public exists(path: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const defaultOpts = { timeout: 100 };
            return this.page.waitForSelector(path, { ...defaultOpts, ...opts });
        }
        return this.select(path);
    }

    public visible(path: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const defaultOpts = { visible: true, timeout: 100 };
            return this.exists(path, { ...defaultOpts, ...opts });
        }
        return this.select(path);
    }

    public select(path: string, findIn?: any): Promise<any> {
        return this.response.asyncSelect(path, findIn);
    }

    public selectAll(path: string, findIn?: any): Promise<any[]> {
        return this.response.asyncSelectAll(path, findIn);
    }

    public click(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this._isBrowserRequest && this.page !== null) {
                const page = this.page;
                // Try this method first
                page.click(path)
                    .then(resolve)
                    // But sometimes it fails, so try this as a backup
                    .catch(() => {
                        page.evaluate(`
                            (function() {
                                const el = document.querySelector('${path}');
                                if (el) { el.click(); return true; }
                                else { return false; }
                            })();`
                        )
                            .then((result) => {
                                result ? resolve() : reject();
                            })
                            .catch(reject);
                    });
            }
            else {
                reject();
            }
        })
    }

}