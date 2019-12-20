import { ResponseType } from "./enums";
import { iResponse, iValue } from "./interfaces";
import { Page, ElementHandle } from "puppeteer";
import { PuppeteerResponse } from "./puppeteerresponse";
import { PuppeteerElement } from "./puppeteerelement";
import { asyncForEach } from "./util";

export class BrowserResponse extends PuppeteerResponse implements iResponse {
  public get responseTypeName(): string {
    return "Browser";
  }

  public get responseType(): ResponseType {
    return ResponseType.browser;
  }

  /**
   * Select the first matching element
   *
   * @param path
   */
  public async find(path: string): Promise<iValue> {
    const page: Page | null = this.context.page;
    if (page !== null) {
      const el: ElementHandle<Element> | null = await page.$(path);
      if (el !== null) {
        return await PuppeteerElement.create(el, this.context, null, path);
      }
    }
    return this._wrapAsValue(null, path);
  }

  /**
   * Select all matching elements
   *
   * @param path
   */
  public findAll(path: string): Promise<PuppeteerElement[]> {
    return new Promise(async resolve => {
      const response: iResponse = this;
      const puppeteerElements: PuppeteerElement[] = [];
      if (this.context.page !== null) {
        const elements: ElementHandle[] = await this.context.page.$$(path);
        await asyncForEach(
          elements,
          async (el: ElementHandle<Element>, i: number) => {
            const element = await PuppeteerElement.create(
              el,
              response.context,
              `${path} [${i}]`,
              path
            );
            puppeteerElements.push(element);
          }
        );
      }
      resolve(puppeteerElements);
    });
  }
}
