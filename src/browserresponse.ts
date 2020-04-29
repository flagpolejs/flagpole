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
    return "browser";
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
    return new Promise(async (resolve) => {
      const response: iResponse = this;
      const puppeteerElements: PuppeteerElement[] = [];
      if (this.context.page !== null) {
        const elements: ElementHandle[] = await this.context.page.$$(path);
        await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
          const element = await PuppeteerElement.create(
            el,
            response.context,
            `${path} [${i}]`,
            path
          );
          puppeteerElements.push(element);
        });
      }
      resolve(puppeteerElements);
    });
  }

  public async findXPath(xPath: string): Promise<iValue> {
    const page: Page | null = this.context.page;
    if (page !== null) {
      const elements: ElementHandle<Element>[] = await page.$x(xPath);
      if (elements.length > 0) {
        return await PuppeteerElement.create(
          elements[0],
          this.context,
          null,
          xPath
        );
      }
    }
    return this._wrapAsValue(null, xPath);
  }

  public findAllXPath(xPath: string): Promise<PuppeteerElement[]> {
    return new Promise(async (resolve) => {
      const response: iResponse = this;
      const puppeteerElements: PuppeteerElement[] = [];
      if (this.context.page !== null) {
        const elements: ElementHandle[] = await this.context.page.$x(xPath);
        await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
          const element = await PuppeteerElement.create(
            el,
            response.context,
            `${xPath} [${i}]`,
            xPath
          );
          puppeteerElements.push(element);
        });
      }
      resolve(puppeteerElements);
    });
  }
}
