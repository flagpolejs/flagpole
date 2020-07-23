import { ResponseType } from "../enums";
import { iResponse, iValue, FindOptions, FindAllOptions } from "../interfaces";
import { ElementHandle } from "puppeteer-core";
import { PuppeteerResponse } from "./puppeteerresponse";
import {
  asyncForEach,
  arrayify,
  asyncMap,
  getFindParams,
  filterFind,
  findOne,
  wrapAsValue,
  getFindName,
} from "../util";
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
  public async find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): Promise<iValue> {
    // Filter with options
    const params = getFindParams(a, b);
    if (params.opts || params.matches || params.contains) {
      return findOne(this, selector, params);
    }
    // No options, so just find from selector
    const el: ElementHandle<Element> | null = await this._page.$(selector);
    return el === null
      ? wrapAsValue(this.context, null, selector)
      : BrowserElement.create(el, this.context, selector, selector);
  }

  /**
   * Select all matching elements
   *
   * @param path
   */
  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const params = getFindParams(a, b);
    const elements: BrowserElement[] = await asyncMap(
      await this._page.$$(selector),
      async (el: ElementHandle<Element>, i) => {
        return await BrowserElement.create(
          el,
          this.context,
          getFindName(params, selector, i),
          selector
        );
      }
    );
    return filterFind(elements, params.contains || params.matches, params.opts);
  }

  public async findXPath(xPath: string): Promise<iValue> {
    if (this.page === null) {
      throw "Page not found.";
    }
    const elements: ElementHandle<Element>[] = await this.page.$x(xPath);
    if (elements.length > 0) {
      return await BrowserElement.create(
        elements[0],
        this.context,
        xPath,
        xPath
      );
    }
    return wrapAsValue(this.context, null, xPath);
  }

  public async findAllXPath(xPath: string): Promise<BrowserElement[]> {
    if (this.page === null) {
      throw "Page not found.";
    }
    const response: iResponse = this;
    const out: BrowserElement[] = [];
    const elements: ElementHandle[] = await this.page.$x(xPath);
    await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
      const element = await BrowserElement.create(
        el,
        response.context,
        `${xPath} [${i}]`,
        xPath
      );
      out.push(element);
    });
    return out;
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
    if (this.page === null) {
      throw "Page was null.";
    }
    await this.page.select.apply(this.page, [
      selector,
      ...arrayify<string>(value),
    ]);
  }
}
