import {
  Page,
  ElementHandle,
  Browser,
  Response,
  EvaluateFn,
  SerializableOrJSHandle,
} from "puppeteer-core";
import { iResponse, ScreenshotOpts } from "../interfaces";
import { BrowserControl } from "./browsercontrol";
import { DOMResponse } from "../html/domresponse";
import { toType } from "../util";

export abstract class PuppeteerResponse extends DOMResponse
  implements iResponse {
  /**
   * Is this a browser based test
   */
  public get isBrowser(): boolean {
    return true;
  }

  public get browserControl(): BrowserControl {
    return this.scenario.getBrowserControl();
  }

  public get page(): Page | null {
    return this.scenario.getBrowserControl().page;
  }

  public get browser(): Browser | null {
    return this.scenario.getBrowserControl().browser;
  }

  public get response(): Response | null {
    return this.scenario.getBrowserControl().response;
  }

  protected get _page(): Page {
    if (this.page === null) {
      throw "Puppeteer page object was not found.";
    }
    return this.page;
  }

  /**
   * Run this code in the browser
   */
  public async eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<any> {
    if (this.page === null) {
      throw "Page does not exist.";
    }
    return this.page.evaluate.apply(this.page, [js, ...args]);
  }

  /**
   * Wait for network to be idle for 500ms before continuing
   *
   * @param timeout
   */
  public async waitForNetworkIdle(timeout: number = 10000): Promise<void> {
    if (this.page !== null) {
      await this.page.waitForNavigation({
        timeout: timeout,
        waitUntil: "networkidle0",
      });
      return;
    }
    return super.waitForNetworkIdle(timeout);
  }

  /**
   * Wait for network to have no more than two connections for 500ms before continuing
   *
   * @param timeout
   */
  public async waitForNavigation(
    timeout: number = 10000,
    waitFor?: string | string[]
  ): Promise<void> {
    if (this.page !== null) {
      const allowedOptions: string[] = [
        "load",
        "domcontentloaded",
        "networkidle0",
        "networkidle2",
      ];
      // @ts-ignore VS Code freaks out about this, but it's valid return output for LoadEvent
      const waitForEvent: LoadEvent[] = (() => {
        if (
          typeof waitFor == "string" &&
          allowedOptions.indexOf(waitFor) >= 0
        ) {
          return [waitFor];
        } else if (
          toType(waitFor) == "array" &&
          (<string[]>waitFor).every((waitForItem) => {
            return allowedOptions.indexOf(waitForItem) >= 0;
          })
        ) {
          return waitFor;
        } else {
          return ["networkidle2"];
        }
      })();
      await this.page.waitForNavigation({
        timeout: timeout,
        waitUntil: waitForEvent,
      });
      return;
    }
    return super.waitForNavigation(timeout, waitFor);
  }

  /**
   * Wait for everything to load before continuing
   *
   * @param timeout
   */
  public async waitForLoad(timeout: number = 30000): Promise<void> {
    if (this.page !== null) {
      await this.page.waitForNavigation({
        timeout: timeout,
        waitUntil: "load",
      });
      return;
    }
    return super.waitForLoad(timeout);
  }

  /**
   * Wait for DOM Loaded before continuing
   *
   * @param timeout
   */
  public async waitForReady(timeout: number = 15000): Promise<void> {
    if (this.page !== null) {
      await this.page.waitForNavigation({
        timeout: timeout,
        waitUntil: "domcontentloaded",
      });
      return;
    }
    return super.waitForReady(timeout);
  }

  public screenshot(): Promise<Buffer>;
  public screenshot(localFilePath: string): Promise<Buffer>;
  public screenshot(
    localFilePath: string,
    opts: ScreenshotOpts
  ): Promise<Buffer>;
  public screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  public screenshot(
    a?: string | ScreenshotOpts,
    b?: ScreenshotOpts
  ): Promise<Buffer> {
    const localFilePath = typeof a == "string" ? a : undefined;
    const opts: ScreenshotOpts = (typeof a !== "string" ? a : b) || {};
    if (this.page !== null) {
      return this.page.screenshot({
        path: localFilePath || opts.path,
        encoding: "binary",
        omitBackground: opts.omitBackground || false,
        clip: opts.clip || undefined,
        fullPage: opts.fullPage || false,
      });
    }
    throw new Error(`No page found, so can't take a screenshot.`);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    if (this.page !== null) {
      return await this.page.type(selector, textToType, opts);
    }
    throw new Error(`Can not type into element ${selector}`);
  }

  public async clear(selector: string): Promise<any> {
    if (this.page !== null) {
      const input: ElementHandle<Element> | null = await this.page.$(selector);
      if (input !== null) {
        await input.click({ clickCount: 3 });
        return await this.page.keyboard.press("Backspace");
      }
    }
    throw new Error(`Can not type into this element ${selector}`);
  }

  public async scrollTo(point: { x: number; y: number }): Promise<iResponse> {
    await this._page.evaluate(
      (x, y) => {
        window.scrollTo(x, y);
      },
      point.x || 0,
      point.y || 0
    );
    return this;
  }
}
