import { Scenario } from "./scenario";
import { NodeElement } from "./nodeelement";
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
    public async asyncSelect(path: string, findIn?: any): Promise<NodeElement | null> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        if (page !== null) {
            const el: ElementHandle<Element> | null = await page.$(path);
            if (el !== null) {
                return new NodeElement(el, new AssertionContext(response.scenario, response), path);
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
    public async asyncSelectAll(path: string, findIn?: any): Promise<NodeElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const nodeElements: NodeElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            elements.forEach((el: ElementHandle<Element>) => {
                nodeElements.push(
                    new NodeElement(
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
