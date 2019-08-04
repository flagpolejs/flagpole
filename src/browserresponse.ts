import { Scenario } from "./scenario";
import { DOMElement } from "./domelement";
import { Node } from "./node";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { Browser } from './browser';
import { Page, ElementHandle } from 'puppeteer';
import { AssertionContext } from './assertioncontext';

export class BrowserResponse extends GenericResponse implements iResponse {

    public get typeName(): string {
        return 'Browser';
    }

    public get browser(): Browser {
        return this.scenario.getBrowser();
    }

    public get page(): Page | null {
        return this.scenario.getBrowser().getPage();
    }

    public getType(): ResponseType {
        return ResponseType.browser;
    }

    /**
     * Select the first matching element
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
                return await DOMElement.create(
                    el, this.getAssertionContext(), null, path
                );
            }
        }
        return null;
    }

    /**
     * Select all matching elements
     * 
     * @param path 
     * @param findIn 
     */
    public async asyncSelectAll(path: string, findIn?: any): Promise<DOMElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const domElements: DOMElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            await elements.forEach(async function (el: ElementHandle<Element>, i: number) {
                const domElement = await DOMElement.create(
                    el, response.getAssertionContext(), `${path} [${i}]`, path
                );
                domElements.push(domElement);
            });
        }
        return domElements;
    }

    /**
     * Runt his code in the browser
     */
    public async evaluate(context: any, callback: Function): Promise<any> {
        if (this.page !== null) {
            const functionName: string = `flagpole_${Date.now()}`;
            const jsToInject: string = `window.${functionName} = ${callback}`;
            await this.page.addScriptTag({ content: jsToInject });
            return await this.page.evaluate(functionName => {
                return window[functionName]();
            }, functionName);
        }
        throw new Error('Cannot evaluate code becuase page is null.');
    }

    /**
     * DEPRECATED
     */
    public select(path: string, findIn?: any): Node {
        throw new Error('Deprecated. Select is longer supported.');
    }

}
