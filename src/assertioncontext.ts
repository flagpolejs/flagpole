import { Scenario } from './scenario';
import { iResponse, ResponseType } from './response';
import { Suite } from './suite';
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { Assertion } from './assertion';
import { reject } from 'bluebird';
import { DOMElement } from './domelement';
import { HtmlResponse } from './htmlresponse';
import { Value } from './value';

export class AssertionContext {

    private _scenario: Scenario;
    private _response: iResponse;

    private get _isBrowserRequest(): boolean {
        return this._scenario.responseType == ResponseType.browser;
    }

    private get _isHtmlRequest(): boolean {
        return this._scenario.responseType == ResponseType.html;
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

    public async type(path: string, textToType: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            return await this.page.type(path, textToType, opts);
        }
        else if (this._isHtmlRequest) {
            const htmlResponse = this.response as HtmlResponse;
            return await htmlResponse.evaluate(this, function ($) {
                $(path).val(textToType);
            });
        }
        throw new Error('Can not type into this element.');
    }

    public async evaluate(callback: Function): Promise<any> {
        return await this.response.evaluate(this, callback);
    }

    public async exists(path: string, opts: any = {}): Promise<any> {
        const context = this;
        return new Promise(async function (resolve) {
            if (context._isBrowserRequest && context.page !== null) {
                const defaultOpts = { timeout: 100 };
                const element = await context.page.waitForSelector(path, { ...defaultOpts, ...opts });
                resolve(DOMElement.create(element, context, path, path));
            }
            else if (context._isHtmlRequest) {
                return await context.select(path);
            }
            else {
                throw new Error('waitFor is not available in this context');
            }
        });
    }

    public async visible(path: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const defaultOpts = { visible: true, timeout: 100 };
            const element = await this.page.waitForSelector(path, { ...defaultOpts, ...opts });
            return DOMElement.create(element, this, path, path);
        }
        throw new Error('visible is not available in this context');
    }

    public select(path: string, findIn?: any): Promise<any> {
        return this.response.asyncSelect(path, findIn);
    }

    public selectAll(path: string, findIn?: any): Promise<any[]> {
        return this.response.asyncSelectAll(path, findIn);
    }

    public async submit(path: string): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const form = await this.page.$(path);
            return await this.page.evaluate(form => form.submit(), form);
        }
        else if (this._isHtmlRequest) {
            const form: DOMElement | null = await this.select(path);
            if (form !== null) {
                return await form.submit();
            }
        }
        throw new Error('Could not submit.')
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