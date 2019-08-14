import { DOMElement } from "./domelement";
import { iResponse, ResponseType } from "./response";
import { Page, ElementHandle } from 'puppeteer';
import { BrowserResponse } from './browserresponse';

export class ExtJSResponse extends BrowserResponse implements iResponse {

    public get typeName(): string {
        return 'ExtJS';
    }

    public get type(): ResponseType {
        return ResponseType.extjs;
    }

    /**
     * Select the first matching element
     * 
     * @param path 
     * @param findIn 
     */
    public async find(path: string): Promise<DOMElement | null> {
        const page: Page | null = this.scenario.getBrowser().getPage();
        if (page !== null) {
            const el: ElementHandle<Element> | null = await page.$(path);
            if (el !== null) {
                return await DOMElement.create(
                    el, this.context, null, path
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
    public async findAll(path: string): Promise<DOMElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const domElements: DOMElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            await elements.forEach(async function (el: ElementHandle<Element>, i: number) {
                const domElement = await DOMElement.create(
                    el, response.context, `${path} [${i}]`, path
                );
                domElements.push(domElement);
            });
        }
        return domElements;
    }

}
