import { Scenario } from './scenario';
import { iResponse, ResponseType } from './response';
import { Suite } from './suite';
import { Browser } from './browser';
import { Page, ElementHandle, LoadEvent } from 'puppeteer';
import { Assertion } from './assertion';
import { DOMElement } from './domelement';
import { HtmlResponse } from './htmlresponse';
import { Value } from './value';
import { Flagpole } from '.';

export class AssertionContext {

    private _scenario: Scenario;
    private _response: iResponse;

    private get _isBrowserRequest(): boolean {
        return this._response.isBrowser;
    }

    private get _isHtmlRequest(): boolean {
        return this._scenario.responseType == ResponseType.html;
    }

    /**
     * Get returned value from previous next block
     */
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

    /**
     * Make a comment in the scenario output
     * 
     * @param message 
     */
    public comment(message: string) {
        this._scenario.comment(message);
    }

    /**
     * Create a new assertion based on this value
     * 
     * @param message 
     * @param value 
     */
    public assert(message: string, value: any): Assertion;
    public assert(value: any): Assertion;
    public assert(a: any, b?: any): Assertion {
        const value = typeof b !== 'undefined' ? b : a;
        const message = typeof b !== 'undefined' ? a : undefined;
        return new Assertion(this, value, message);
    }

    /**
     * Wait for this number of milliseconds
     * 
     * @param milliseconds 
     */
    public pause(milliseconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.comment('Paused ' + milliseconds + ' milliseconds');
                resolve();
            }, milliseconds);
        });
    }

    /**
     * Get first element with the given selector that has text content matching the search 
     * 
     * @param selector
     * @param searchForText 
     */
    public async findHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement | null> {
        if (
            (this._isBrowserRequest && this.page !== null) ||
            this._isHtmlRequest
        ) {
            let matchingElement: DOMElement | null = null;
            const elements: DOMElement[] = await this.findAll(selector);
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
        throw new Error('findHavingText is not available in this context');
    };

    /**
     * Get all elements with the given selector that has text content matching the search
     * 
     * @param selector
     * @param searchForText 
     */
    public async findAllHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement[]> {
        if (
            (this._isBrowserRequest && this.page !== null) ||
            this._isHtmlRequest
        ) {
            let matchingElements: DOMElement[] = [];
            const elements: DOMElement[] = await this.findAll(selector);
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
        throw new Error('findAllHavingText is not available in this context');
    };

    /**
     * Clear any current input and then type this into the input box
     * 
     * @param selector
     * @param textToType 
     * @param opts 
     */
    public async clearThenType(selector: string, textToType: string, opts: any = {}): Promise<any> {
        await this.clear(selector);
        return this.type(selector, textToType, opts);
    }

    /**
     * Clear any current input in this input box
     * 
     * @param selector
     */
    public async clear(selector: string): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            const input: ElementHandle<Element> | null = await this.page.$(selector);
            if (input !== null) {
                await input.click({ clickCount: 3 });
                return await this.page.keyboard.press('Backspace');
            }   
        }
        else if (this._isHtmlRequest) {
            const htmlResponse = this.response as HtmlResponse;
            return await htmlResponse.evaluate(this, function ($: Cheerio) {
                $.find(selector).val('');
            });
        }
        throw new Error(`Can not type into this element ${selector}`);
    }

    /**
     * Type this text into the given input box
     * 
     * @param selector
     * @param textToType 
     * @param opts 
     */
    public async type(selector: string, textToType: string, opts: any = {}): Promise<any> {
        if (this._isBrowserRequest && this.page !== null) {
            return await this.page.type(selector, textToType, opts);
        }
        else if (this._isHtmlRequest) {
            const htmlResponse = this.response as HtmlResponse;
            return await htmlResponse.evaluate(this, function ($) {
                let currentValue = $(selector).val();
                $(selector).val(currentValue + textToType);
            });
        }
        throw new Error(`Can not type into element ${selector}`);
    }

    /**
     * Select items from a dropdown or multi-select box
     * 
     * @param selector
     * @param value 
     */
    public select(selector: string, value: string | string[]): Promise<string[]> {
        if (this._isBrowserRequest && this.page !== null) {
            const values: string[] = (typeof value == 'string') ? [value] : value;
            // @ts-ignore VS Code is unhappy no matter what I do
            return this.page.select.apply(null, [selector].concat(values));
        }
        throw new Error('Select not available in this context.');
    }

    /**
     * Execute this javascript against the response
     * 
     * @param callback 
     */
    public async evaluate(callback: Function): Promise<any> {
        return await this.response.evaluate(this, callback);
    }

    /**
     * Wait for DOM Loaded before continuing
     * 
     * @param timeout 
     */
    public async waitForReady(timeout: number = 15000): Promise<void> {
        if (this._isBrowserRequest && this.page !== null) {
            await this.page.waitForNavigation({
                timeout: timeout,
                waitUntil: 'domcontentloaded'
            });
            return;
        }
        return this.pause(1);
    }

    /**
     * Wait for everything to load before continuing
     * 
     * @param timeout 
     */
    public async waitForLoad(timeout: number = 30000): Promise<void> {
        if (this._isBrowserRequest && this.page !== null) {
            await this.page.waitForNavigation({
                timeout: timeout,
                waitUntil: 'load'
            });
            return;
        }
        return this.pause(1);
    }

    /**
     * Wait for network to be idle for 500ms before continuing
     * 
     * @param timeout 
     */
    public async waitForNetworkIdle(timeout: number = 10000): Promise<void> {
        if (this._isBrowserRequest && this.page !== null) {
            await this.page.waitForNavigation({
                timeout: timeout,
                waitUntil: 'networkidle0'
            });
            return;
        }
        return this.pause(1);
    }

    /**
     * Wait for network to have no more than two connections for 500ms before continuing
     * 
     * @param timeout 
     */
    public async waitForNavigation(timeout: number = 10000, waitFor?: string | string[]): Promise<void> {
        if (this._isBrowserRequest && this.page !== null) {
            const allowedOptions: string[] = ["load", "domcontentloaded", "networkidle0", "networkidle2"];
            // @ts-ignore VS Code freaks out about this, but it's valid return output for LoadEvent
            const waitForEvent: LoadEvent[] = (() => {
                if (typeof waitFor == 'string' && allowedOptions.indexOf(waitFor) >= 0) {
                    return [waitFor];
                }
                else if (
                    Flagpole.toType(waitFor) == 'array' &&
                    (<string[]>waitFor).every((waitForItem) => {
                        return (allowedOptions.indexOf(waitForItem) >= 0);
                    })
                ) {
                    return waitFor;
                }
                else {
                    return ["networkidle2"];
                }
            })();
            await this.page.waitForNavigation({
                timeout: timeout,
                waitUntil: waitForEvent
            });
            return;
        }
        return this.pause(1);
    }

    /**
     * Wait for element at the selected path to be hidden
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForHidden(selector: string, timeout: number = 100): Promise<DOMElement | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100, hidden: true };
            const element = await this.page.waitForSelector(selector, opts);
            return DOMElement.create(element, this, selector, selector);
        }
        else if (this._isHtmlRequest) {
            return this.find(selector);
        }
        throw new Error('waitForHidden is not available in this context');
    }

    /**
     * Wait for element at the selected path to be visible
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForVisible(selector: string, timeout: number = 100): Promise<DOMElement | null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100, visible: true };
            const element = await this.page.waitForSelector(selector, opts);
            return DOMElement.create(element, this, selector, selector);
        }
        else if (this._isHtmlRequest) {
            return this.find(selector);
        }
        throw new Error('waitForVisible is not available in this context');
    }

    /**
     * Wait for element at the selected path to exist in the DOM
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForExists(selector: string, timeout?: number): Promise<DOMElement |  null> {
        if (this._isBrowserRequest && this.page !== null) {
            const opts = { timeout: timeout || 100 };
            const element = await this.page.waitForSelector(selector, opts);
            return DOMElement.create(element, this, selector, selector);
        }
        else if (this._isHtmlRequest) {
            return this.find(selector);
        }
        throw new Error('waitForExists is not available in this context');
    }

    /**
     * Find for first element at this selector path
     * 
     * @param selector
     */
    public find(selector: string): Promise<any> {
        return this.response.find(selector);
    }

    /**
     * Find all elements at this selector path
     * 
     * @param selector
     */
    public findAll(selector: string): Promise<any[]> {
        return this.response.findAll(selector);
    }

    /**
     * Submit this form
     * 
     * @param selector
     */
    public async submit(selector: string): Promise<any> {
        const el: DOMElement = await this.find(selector);
        if (el === null) {
            throw new Error(`Element with selector ${selector} not found.`);
        }
        return el.submit();
    }

    /**
     * Click on this element
     * 
     * @param selector
     */
    public async click(selector: string): Promise<any> {
        const el: DOMElement = await this.find(selector);
        if (el === null) {
            throw new Error(`Element with selector ${selector} not found.`);
        }
        return el.click();
    }

    /**
     * Save the response body into a temporary file and open it. This is mainly for debugging.
     */
    public async openInBrowser(): Promise<string> {
        const output = this.response.body.toString();
        const filePath: string = await Flagpole.openInBrowser(output);
        this.scenario.comment(`Open response in browser temp file: ${filePath}`);
        return filePath;
    }

    /**
     * Take a screenshot
     * 
     * @param opts 
     */
    public async screenshot(opts: any): Promise<Buffer | string> {
        if (this._isBrowserRequest) {
            if (this.page !== null) {
                return await this.page.screenshot(opts);
            }
            throw new Error(`No page found, so can't take a screenshot.`);
        }
        throw new Error(`This scenario type (${this.response.typeName}) does not support screenshots.`);
    }

}