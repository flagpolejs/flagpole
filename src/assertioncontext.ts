import { Scenario } from './scenario';
import { iResponse } from './response';
import { Suite } from './suite';
import { Browser } from './browser';
import { Page } from 'puppeteer';
import { Assertion } from './assertion';
import { DOMElement } from './domelement';
import { Flagpole, iValue } from '.';

export class AssertionContext {

    private _scenario: Scenario;
    private _response: iResponse;

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
        return this.response.isBrowser ?
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
        return this.findHavingText(selector, searchForText);
    };

    /**
     * Get all elements with the given selector that has text content matching the search
     * 
     * @param selector
     * @param searchForText 
     */
    public async findAllHavingText(selector: string, searchForText: string | RegExp): Promise<DOMElement[]> {
        return this.findAllHavingText(selector, searchForText);
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
        return this.response.clearValue(selector);
    }

    public async type(selector: string, textToType: string, opts: any = {}): Promise<any> {
        return this.response.typeText(selector, textToType, opts);
    }

    /**
     * Select items from a dropdown or multi-select box
     * 
     * @param selector
     * @param value 
     */
    public select(selector: string, value: string | string[]): Promise<string[]> {
        return this.response.selectOption(selector, value);
    }

    /**
     * Execute this javascript against the response
     * 
     * @param callback 
     */
    public async evaluate(callback: Function): Promise<any> {
        return await this.response.evaluate(this, callback);
    }

    public async waitForReady(timeout: number = 15000): Promise<void> {
        return this.response.waitForReady(timeout);
    }

    public async waitForLoad(timeout: number = 30000): Promise<void> {
        return this.response.waitForLoad(timeout);
    }

    public async waitForNetworkIdle(timeout: number = 10000): Promise<void> {
        return this.response.waitForNetworkIdle(timeout);
    }

    public async waitForNavigation(timeout: number = 10000, waitFor?: string | string[]): Promise<void> {
        return this.response.waitForNavigation(timeout, waitFor);
    }

    /**
     * Wait for element at the selected path to be hidden
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForHidden(selector: string, timeout: number = 100): Promise<iValue | null> {
        return this.response.waitForHidden(selector, timeout);
    }

    /**
     * Wait for element at the selected path to be visible
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForVisible(selector: string, timeout: number = 100): Promise<iValue | null> {
        return this.response.waitForVisible(selector, timeout);
    }

    /**
     * Wait for element at the selected path to exist in the DOM
     * 
     * @param selector
     * @param timeout 
     */
    public async waitForExists(selector: string, timeout?: number): Promise<iValue |  null> {
        return this.response.waitForExists(selector, timeout);
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

    public async screenshot(opts: any): Promise<Buffer | string> {
        return this.response.screenshot(opts);
    }

}