import { iResponse } from "../interfaces/iresponse";
import { FindOptions, FindAllOptions } from "../interfaces/find-options";
import {
  PointerMove,
  PointerButton,
  PointerDisposition,
} from "../interfaces/pointer";
import { ElementHandle } from "puppeteer-core";
import { PuppeteerResponse } from "./puppeteer-response";
import {
  getFindParams,
  filterFind,
  findOne,
  getFindName,
  asyncForEach,
  asyncMap,
} from "../helpers";
import { BrowserElement } from "./browser-element";
import { ValuePromise } from "../value-promise";
import { iValue } from "../interfaces/ivalue";

type ElementQueryResult = ElementHandle<Element> | null;

export class BrowserResponse extends PuppeteerResponse {
  /**
   * Select the first matching element
   *
   * @param path
   */
  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise<ElementQueryResult> {
    return ValuePromise.execute(async () => {
      // Filter with options
      const params = getFindParams(a, b);
      if (params.opts || params.matches || params.contains) {
        return findOne(this, selector, params);
      }
      // No options, so just find from selector
      const el: ElementQueryResult = await this._page.$(selector);
      return el === null
        ? this.valueFactory.createNull(selector)
        : BrowserElement.create(el, this.context, { name: selector, selector });
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
        return await BrowserElement.create(el, this.context, {
          name: getFindName(params, selector, i),
          selector,
        });
      }
    );
    return filterFind(elements, params.contains || params.matches, params.opts);
  }

  public findXPath(xPath: string): ValuePromise {
    const opts: ValueOptions = {
      name: xPath,
      selector: xPath,
    };
    return ValuePromise.execute(async () => {
      const elements: ElementHandle<Element>[] = await this._page.$x(xPath);
      if (elements.length > 0) {
        return await BrowserElement.create(elements[0], this.context, opts);
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public async findAllXPath(xPath: string): Promise<BrowserElement[]> {
    const out: BrowserElement[] = [];
    const elements: ElementHandle[] = await this._page.$x(xPath);
    await asyncForEach(elements, async (el: ElementHandle<Element>, i) => {
      const element = await BrowserElement.create(el, this.context, {
        name: `${xPath} [${i}]`,
        selector: xPath,
      });
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
  public waitForHidden(selector: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      const opts = {
        timeout: this.getTimeoutFromOverload(timeout),
        hidden: true,
      };
      const element = await this._page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, {
        name: selector,
        selector,
      });
    });
  }

  public waitForVisible(selector: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      const opts = {
        timeout: this.getTimeoutFromOverload(timeout),
        visible: true,
      };
      const element = await this._page.waitForSelector(selector, opts);
      return BrowserElement.create(element, this.context, {
        name: selector,
        selector,
      });
    });
  }

  public waitForExists(selector: string, timeout?: number): ValuePromise;
  public waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise;
  public waitForExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const opts = { timeout: this.getTimeoutFromOverload(a, b) };
      const pattern = this.getContainsPatternFromOverload(a);
      if (pattern === null) {
        const element = await this._page.waitForSelector(selector, opts);
        return BrowserElement.create(element, this.context, {
          name: selector,
          selector,
        });
      }
      const element = (
        await this._page.waitForFunction(
          `Array.from(document.querySelectorAll("${selector}")).find(function(element) {
            return (${pattern}).test(element.innerText)
          })`,
          opts
        )
      ).asElement();
      return BrowserElement.create(element!, this.context, {
        name: selector,
        selector,
      });
    });
  }

  public waitForXPath(xPath: string, timeout?: number): ValuePromise {
    return ValuePromise.execute(async () => {
      const opts = { timeout: this.getTimeoutFromOverload(timeout) };
      const element = await this._page.waitForXPath(xPath, opts);
      return BrowserElement.create(element, this.context, {
        name: xPath,
        selector: xPath,
      });
    });
  }

  public waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): ValuePromise {
    return ValuePromise.execute(async () =>
      this.waitForExists(selector, text, timeout)
    );
  }

  public waitForNotExists(selector: string, timeout?: number): ValuePromise;
  public waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise;
  public waitForNotExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): ValuePromise {
    return ValuePromise.execute(async () => {
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
      return this.valueFactory.create(true, { selector });
    });
  }

  public selectOption(
    selector: string,
    value: string | string[]
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const element = await this.find(selector);
      await element.selectOption(value);
      return element;
    });
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
