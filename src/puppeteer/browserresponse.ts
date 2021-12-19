import {
  iResponse,
  iValue,
  FindOptions,
  FindAllOptions,
  PointerMove,
  PointerButton,
  PointerDisposition,
} from "../interfaces";
import { ElementHandle } from "puppeteer-core";
import { PuppeteerResponse } from "./puppeteerresponse";
import { asyncForEach, toArray, asyncMap } from "../util";
import {
  getFindParams,
  filterFind,
  findOne,
  wrapAsValue,
  getFindName,
} from "../helpers";
import { BrowserElement } from "./browserelement";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";

export class BrowserResponse extends PuppeteerResponse implements iResponse {
  public get responseTypeName(): string {
    return "Browser";
  }

  public get responseType(): ScenarioType {
    return "browser";
  }

  /**
   * Select the first matching element
   *
   * @param path
   */
  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
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
    });
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
    const elements: ElementHandle<Element>[] = await this._page.$x(xPath);
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
    const response: iResponse = this;
    const out: BrowserElement[] = [];
    const elements: ElementHandle[] = await this._page.$x(xPath);
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
    timeout?: number
  ): Promise<BrowserElement> {
    const opts = {
      timeout: this.getTimeoutFromOverload(timeout),
      hidden: true,
    };
    const element = await this._page.waitForSelector(selector, opts);
    return BrowserElement.create(element, this.context, selector, selector);
  }

  public async waitForVisible(
    selector: string,
    timeout?: number
  ): Promise<BrowserElement> {
    const opts = {
      timeout: this.getTimeoutFromOverload(timeout),
      visible: true,
    };
    const element = await this._page.waitForSelector(selector, opts);
    return BrowserElement.create(element, this.context, selector, selector);
  }

  public async waitForExists(
    selector: string,
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): Promise<BrowserElement> {
    const opts = { timeout: this.getTimeoutFromOverload(a, b) };
    const pattern = this.getContainsPatternFromOverload(a);
    if (pattern === null) {
      const element = await this._page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, selector, selector);
    }
    const element = (
      await this._page.waitForFunction(
        `Array.from(document.querySelectorAll("${selector}")).find(function(element) {
            return (${pattern}).test(element.innerText)
          })`,
        opts
      )
    ).asElement();
    return BrowserElement.create(element!, this.context, selector, selector);
  }

  public async waitForXPath(
    xPath: string,
    timeout?: number
  ): Promise<BrowserElement> {
    const opts = { timeout: this.getTimeoutFromOverload(timeout) };
    const element = await this._page.waitForXPath(xPath, opts);
    return BrowserElement.create(element, this.context, xPath, xPath);
  }

  public async waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): Promise<iValue> {
    return this.waitForExists(selector, text, timeout);
  }

  public async waitForNotExists(
    selector: string,
    timeout?: number
  ): Promise<iValue>;
  public async waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  public async waitForNotExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): Promise<iValue> {
    const opts = { timeout: this.getTimeoutFromOverload(a, b) };
    const pattern = this.getContainsPatternFromOverload(a);
    if (pattern === null) {
      await this._page.waitForFunction(
        (selector) => !document.querySelector(selector),
        opts,
        selector
      );
    } else {
      await this._page.waitForFunction(
        `Array.from(document.querySelectorAll("${selector}")).filter(function(element) {
            return (${pattern}).test(element.innerText)
          }).length == 0`,
        opts
      );
    }
    return wrapAsValue(this.context, true, selector);
  }

  public async selectOption(
    selector: string,
    value: string | string[]
  ): Promise<void> {
    await this._page.select.apply(this.page, [
      selector,
      ...toArray<string>(value),
    ]);
  }

  protected async mouseAction(
    disposition: PointerDisposition,
    button?: PointerButton
  ) {
    if (!button || button == "default") button = "left";
    const opts = {
      button,
    };
    if (disposition == "down") return this.page?.mouse.down(opts);
    if (disposition == "up") return this.page?.mouse.up(opts);
  }

  public async movePointer(...pointers: PointerMove[]): Promise<iResponse> {
    asyncForEach(pointers, async (pointer: PointerMove) => {
      // Default values
      if (!pointer.end) pointer.end = pointer.start;
      if (!pointer.type || pointer.type == "default") pointer.type = "mouse";
      if (!pointer.duration) pointer.duration = 500;
      if (!pointer.disposition) {
        pointer.disposition = { start: "down", end: "up" };
      }
      // Non-mouse events not supported
      if (pointer.type != "mouse") return;
      // Perform the action
      await this.page?.mouse.move(pointer.start[0], pointer.start[1]);
      await this.mouseAction(pointer.disposition.start, pointer.button);
      await this.page?.mouse.move(pointer.end[0], pointer.end[1]);
      await this.mouseAction(pointer.disposition.end, pointer.button);
    });
    return this;
  }
}
