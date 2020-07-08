import { ResponseType } from "./enums";
import { iResponse, iValue } from "./interfaces";
import { Page, ElementHandle } from "puppeteer";
import { PuppeteerResponse } from "./puppeteerresponse";
import { asyncForEach, arrayify } from "./util";
import { BrowserElement } from "./browserelement";

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
        return await BrowserElement.create(el, this.context, path, path);
      }
    }
    return this._wrapAsValue(null, path);
  }

  /**
   * Select all matching elements
   *
   * @param path
   */
  public findAll(path: string): Promise<BrowserElement[]> {
    return new Promise(async (resolve) => {
      const response: iResponse = this;
      const out: BrowserElement[] = [];
      if (this.context.page !== null) {
        const elements: ElementHandle[] = await this.context.page.$$(path);
        await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
          const element = await BrowserElement.create(
            el,
            response.context,
            `${path} [${i}]`,
            path
          );
          out.push(element);
        });
      }
      resolve(out);
    });
  }

  public async findXPath(xPath: string): Promise<iValue> {
    const page: Page | null = this.context.page;
    if (page !== null) {
      const elements: ElementHandle<Element>[] = await page.$x(xPath);
      if (elements.length > 0) {
        return await BrowserElement.create(
          elements[0],
          this.context,
          xPath,
          xPath
        );
      }
    }
    return this._wrapAsValue(null, xPath);
  }

  public findAllXPath(xPath: string): Promise<BrowserElement[]> {
    return new Promise(async (resolve) => {
      const response: iResponse = this;
      const out: BrowserElement[] = [];
      if (this.context.page !== null) {
        const elements: ElementHandle[] = await this.context.page.$x(xPath);
        await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
          const element = await BrowserElement.create(
            el,
            response.context,
            `${xPath} [${i}]`,
            xPath
          );
          out.push(element);
        });
      }
      resolve(out);
    });
  }

  /**
   * Wait for element at the selected path to be hidden
   *
   * @param selector
   * @param timeout
   */
  public async waitForHidden(
    selector: string,
    timeout: number = 100
  ): Promise<BrowserElement> {
    if (this.page !== null) {
      const opts = { timeout: timeout || 100, hidden: true };
      const element = await this.page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, selector, selector);
    }
    throw new Error("waitForHidden is not available in this context");
  }

  public async waitForVisible(
    selector: string,
    timeout: number = 100
  ): Promise<BrowserElement> {
    if (this.page !== null) {
      const opts = { timeout: timeout || 100, visible: true };
      const element = await this.page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, selector, selector);
    }
    throw new Error("waitForVisible is not available in this context");
  }

  public async waitForExists(
    selector: string,
    timeout?: number
  ): Promise<BrowserElement> {
    if (this.page !== null) {
      const opts = { timeout: timeout || 100 };
      const element = await this.page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, selector, selector);
    }
    throw new Error("waitForExists is not available in this context");
  }

  public async waitForXPath(
    xPath: string,
    timeout?: number
  ): Promise<BrowserElement> {
    if (this.page !== null) {
      const opts = { timeout: timeout || 100 };
      const element = await this.page.waitForXPath(xPath, opts);
      return BrowserElement.create(element, this.context, xPath, xPath);
    }
    throw new Error("waitForXPath is not available in this context");
  }

  public async waitForHavingText(
    selector: string,
    text: string,
    timeout?: number
  ): Promise<BrowserElement> {
    if (this.page !== null) {
      const opts = { timeout: timeout || 100 };
      const element = (
        await this.page.waitForFunction(
          `document.querySelector("${selector}").innerText.includes("${text}")`,
          opts
        )
      ).asElement();
      if (element === null) {
        throw `Element ${selector} did not exist after timeout.`;
      }
      return BrowserElement.create(element, this.context, selector, selector);
    }
    throw new Error("waitForExists is not available in this context");
  }

  public async selectOption(
    selector: string,
    value: string | string[]
  ): Promise<void> {
    if (this.page !== null) {
      await this.page.select.apply(this.page, [
        selector,
        ...arrayify<string>(value),
      ]);
    }
    throw new Error("Page was null.");
  }
}
