import { iResponse, ResponseType } from "./response";
import { Page, ElementHandle } from 'puppeteer';
import { PuppeteerResponse } from './puppeteerresponse';
import { PuppeteerElement } from './puppeteerelement';

export class BrowserResponse extends PuppeteerResponse implements iResponse {
 
    public get typeName(): string {
        return 'Browser';
    }

    public get type(): ResponseType {
        return ResponseType.browser;
    }

    /**
     * Select the first matching element
     * 
     * @param path 
     */
    public async find(path: string): Promise<PuppeteerElement | null> {
        const page: Page | null = this.scenario.getBrowser().getPage();
        if (page !== null) {
            const el: ElementHandle<Element> | null = await page.$(path);
            if (el !== null) {
                return await PuppeteerElement.create(
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
     */
    public async findAll(path: string): Promise<PuppeteerElement[]> {
        const response: iResponse = this;
        const page: Page | null = this.scenario.getBrowser().getPage();
        const puppeteerElements: PuppeteerElement[] = [];
        if (page !== null) {
            const elements: ElementHandle[] = await page.$$(path);
            await elements.forEach(async function (el: ElementHandle<Element>, i: number) {
                const element = await PuppeteerElement.create(
                    el, response.context, `${path} [${i}]`, path
                );
                puppeteerElements.push(element);
            });
        }
        return puppeteerElements;
    }

}
