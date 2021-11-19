import {
  Page,
  ElementHandle,
  Browser,
  HTTPResponse,
  EvaluateFn,
  SerializableOrJSHandle,
} from "puppeteer-core";
import { iResponse, ScreenshotOpts, iValue, iHttpRequest } from "../interfaces";
import { BrowserControl } from "./browsercontrol";
import { DOMResponse } from "../html/domresponse";
import { toType } from "../util";
import { wrapAsValue } from "../helpers";

const DEFAULT_WAITFOR_TIMEOUT = 30000;

export abstract class PuppeteerResponse
  extends DOMResponse
  implements iResponse
{
  /**
   * Is this a browser based test
   */
  public get isBrowser(): boolean {
    return true;
  }

  public get browserControl(): BrowserControl | null {
    return this.scenario.browserControl;
  }

  public get page(): Page | null {
    return this.scenario.browserControl?.page || null;
  }

  public get browser(): Browser | null {
    return this.scenario.browserControl?.browser || null;
  }

  public get response(): HTTPResponse | null {
    return this.scenario.browserControl?.response || null;
  }

  public get currentUrl(): iValue {
    const page = this.context.page;
    let url: string | null = null;
    if (page) {
      url = page.url();
    }
    return wrapAsValue(this.context, url, "Current URL");
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
    return this._page.evaluate.apply(this._page, [js, ...args]);
  }

  /**
   * Wait for network to be idle for 500ms before continuing
   *
   * @param timeout
   */
  public async waitForNetworkIdle(timeout?: number): Promise<void> {
    await this._page.waitForNavigation({
      timeout: this.getTimeoutFromOverload(timeout),
      waitUntil: "networkidle0",
    });
    return;
  }

  /**
   * Wait for network to have no more than two connections for 500ms before continuing
   *
   * @param timeout
   */
  public async waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void> {
    const allowedOptions: string[] = [
      "load",
      "domcontentloaded",
      "networkidle0",
      "networkidle2",
    ];
    // @ts-ignore VS Code freaks out about this, but it's valid return output for LoadEvent
    const waitForEvent: LoadEvent[] = (() => {
      if (typeof waitFor == "string" && allowedOptions.indexOf(waitFor) >= 0) {
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
    await this._page.waitForNavigation({
      timeout: this.getTimeoutFromOverload(timeout),
      waitUntil: waitForEvent,
    });
    return;
  }

  /**
   * Wait for everything to load before continuing
   *
   * @param timeout
   */
  public async waitForLoad(timeout?: number): Promise<void> {
    await this._page.waitForNavigation({
      timeout: this.getTimeoutFromOverload(timeout),
      waitUntil: "load",
    });
    return;
  }

  public async waitForFunction(
    js: EvaluateFn<any>,
    opts?: Object,
    ...args: SerializableOrJSHandle[]
  ): Promise<void> {
    await this._page.waitForFunction.apply(this._page, [js, opts, ...args]);
    return;
  }

  /**
   * Wait for DOM Loaded before continuing
   *
   * @param timeout
   */
  public async waitForReady(timeout?: number): Promise<void> {
    await this._page.waitForNavigation({
      timeout: this.getTimeoutFromOverload(timeout),
      waitUntil: "domcontentloaded",
    });
    return;
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
    return this._page.screenshot({
      path: localFilePath || opts.path,
      encoding: "binary",
      omitBackground: opts.omitBackground || false,
      clip: opts.clip || undefined,
      fullPage: opts.fullPage || false,
    });
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    return await this._page.type(selector, textToType, opts);
  }

  public async clear(selector: string): Promise<any> {
    const input: ElementHandle<Element> | null = await this._page.$(selector);
    if (input !== null) {
      await input.click({ clickCount: 3 });
      return await this._page.keyboard.press("Backspace");
    }
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

  protected getTimeoutFromOverload(a: any, b?: any): number {
    return typeof b == "number"
      ? b
      : typeof a == "number"
      ? a
      : DEFAULT_WAITFOR_TIMEOUT;
  }

  protected getContainsPatternFromOverload(contains: any): RegExp | null {
    return contains instanceof RegExp
      ? contains
      : typeof contains == "string"
      ? new RegExp(contains)
      : null;
  }

  public async navigate(req: iHttpRequest) {
    if (req.uri) {
      await this.page?.goto(req.uri);
    }
  }
}
