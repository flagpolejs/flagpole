import { Scenario } from "./scenario";
import { DOMElement } from "./domelement";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { AssertionContext } from './assertioncontext';

export class ExtJSResponse extends GenericResponse implements iResponse {

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

    public get typeName(): string {
        return 'ExtJS';
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
    }

    public getType(): ResponseType {
        return ResponseType.extjs;
    }

    /**
     * Returns one element based on the path selected.
     * 
     * @param path 
     * @param findIn 
     */
    public async asyncSelect(path: string, findIn?: any): Promise<DOMElement | null> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        if (page !== null) {
            const el: ElementHandle<Element> | null = await page.$(path);
            if (el !== null) {
                return new DOMElement(el, new AssertionContext(response.scenario, response), path);
            }
        }
        return null;
    }

    /**
     * Returns an array of elements that match the selection path
     * 
     * @param path 
     * @param findIn 
     */
    public async asyncSelectAll(path: string, findIn?: any): Promise<DOMElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const nodeElements: DOMElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            elements.forEach((el: ElementHandle<Element>) => {
                nodeElements.push(
                    new DOMElement(
                        el,
                        new AssertionContext(response.scenario, response),
                        path
                    )
                );
            });
        }
        return nodeElements;
    }

    /**
     * Runs the code in callback within the context of the browser.
     * 
     * @param context 
     * @param callback 
     */
    public async evaluate(context: any, callback: Function): Promise<any> {
        if (this.page !== null) {
            const functionName: string = `flagpole_${Date.now()}`;
            const jsToInject: string = `window.${functionName} = ${callback}`;
            await this.page.addScriptTag({ content: jsToInject });
            const result = await this.page.evaluate(({ functionName }) => {
                return window[functionName]();
            }, { functionName });
            return result;
        }
        throw new Error('Page is null');
    }

    /**
     * DEPRECATED IN 2.0
     * Jen, don't bother with this
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        throw new Error('This is not supported in ExtJS');
    }

}
