import { Scenario } from './scenario';
import { iResponse, ResponseType } from './response';
import { Suite } from './suite';
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { Assertion } from './assertion';
import { DOMElement } from './domelement';
import { HtmlResponse } from './htmlresponse';
import { Value, iValue } from './value';

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

    public assert(message: string, value: any): Assertion;
    public assert(value: any): Assertion;
    public assert(a: any, b?: any): Assertion {
        const value = typeof b !== 'undefined' ? b : a;
        const message = typeof b !== 'undefined' ? a : undefined;
        return new Assertion(this, value, message);
    }

    public pause(milliseconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
        });
    }

    public async findHavingText(path: string, searchForText: string | RegExp): Promise<DOMElement | null> {
        if (
            (this._isBrowserRequest && this.page !== null) ||
            this._isHtmlRequest
        ) {
            let matchingElement: DOMElement | null = null;
            const elements: DOMElement[] = await this.findAll(path);
            // Loop through elements until we get to the end or find a match
            for (let i = 0; i < elements.length && matchingElement === null; i++) {
                const element: DOMElement = elements[i];
                const text: Value = await element.getText();
                if (typeof searchForText == 'string') {
                    if (text.toString() == String(searchForText)) {
                        matchingElement = element;
                    }
                }
                else {
                    if (searchForText.test(text.toString())) {
                        matchingElement = element;
                    }
                }
            }
            return matchingElement;
        }
        throw new Error('selectHavingText is not available in this context');
    };

    public async findAllHavingText(path: string, searchForText: string | RegExp): Promise<DOMElement[]> {
        if (
            (this._isBrowserRequest && this.page !== null) ||
            this._isHtmlRequest
        ) {
            let matchingElements: DOMElement[] = [];
            const elements: DOMElement[] = await this.findAll(path);
            // Loop through elements until we get to the end or find a match
            for (let i = 0; i < elements.length; i++) {
                const element: DOMElement = elements[i];
                const text: Value = await element.getText();
                if (typeof searchForText == 'string') {
                    if (text.toString() == String(searchForText)) {
                        matchingElements.push(element);
                    }
                }
                else {
                    if (searchForText.test(text.toString())) {
                        matchingElements.push(element);
                    }
                }
            }
            return matchingElements;
        }
        throw new Error('selectAllHavingText is not available in this context');
    };

    public async clearThenType(path: string, textToType: string, opts: any = {}): Promise<any> {
        await this.clear(path);
        return this.type(path, textToType, opts);
    }

    public async clear(path: string): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const input: ElementHandle<Element> | null = await this.page.$(path);
            if (input !== null) {
                await input.click({ clickCount: 3 });
                return await this.page.keyboard.press('Backspace');
            }   
        }
        else if (this._isHtmlRequest) {
            const htmlResponse = this.response as HtmlResponse;
            return await htmlResponse.evaluate(this, function ($: Cheerio) {
                $.find(path).val('');
            });
        }
        throw new Error(`Can not type into this element ${path}`);
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
        throw new Error(`Can not type into element ${path}`);
    }

    public async evaluate(callback: Function): Promise<any> {
        return await this.response.evaluate(this, callback);
    }

    public async waitForHidden(path: string, timeout?: number): Promise<DOMElement | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100, hidden: true };
            const element = await this.page.waitForSelector(path, opts);
            return DOMElement.create(element, this, path, path);
        }
        else if (this._isHtmlRequest) {
            return this.find(path);
        }
        throw new Error('waitForExists is not available in this context');
    }

    public async waitForVisible(path: string, timeout?: number): Promise<DOMElement | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100, visible: true };
            const element = await this.page.waitForSelector(path, opts);
            return DOMElement.create(element, this, path, path);
        }
        else if (this._isHtmlRequest) {
            return this.find(path);
        }
        throw new Error('waitForExists is not available in this context');
    }

    public async waitForExists(path: string, timeout?: number): Promise<DOMElement |  null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100 };
            const element = await this.page.waitForSelector(path, opts);
            return DOMElement.create(element, this, path, path);
        }
        else if (this._isHtmlRequest) {
            return this.find(path);
        }
        throw new Error('waitForExists is not available in this context');
    }

    public find(path: string): Promise<any> {
        return this.response.find(path);
    }

    public findAll(path: string): Promise<any[]> {
        return this.response.findAll(path);
    }

    public async submit(path: string): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const form = await this.page.$(path);
            return await this.page.evaluate(form => form.submit(), form);
        }
        else if (this._isHtmlRequest) {
            const form: DOMElement | null = await this.find(path);
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