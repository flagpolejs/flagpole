import {
  Page,
  Browser,
  Response,
  EvaluateFn,
  SerializableOrJSHandle,
  PageFnOptions,
} from "puppeteer-core";
import { iResponse, iValue } from "../interfaces/general";
import { BrowserControl } from "./browser-control";
import { DOMResponse } from "../html/dom-response";
import { toType } from "../util";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { BrowserScenario } from "./browser-scenario";
import { ExtJsScenario } from "./extjs-scenario";
import { ScreenshotOpts } from "../interfaces/screenshot";
import { iHttpRequest } from "../interfaces/http";

const DEFAULT_WAITFOR_TIMEOUT = 30000;

export abstract class PuppeteerResponse
  extends DOMResponse
  implements iResponse
{
  constructor(public readonly scenario: BrowserScenario | ExtJsScenario) {
    super(scenario);
    this.scenario = scenario;
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

  public get response(): Response | null {
    return this.scenario.browserControl?.response || null;
  }

  public get currentUrl(): iValue {
    const page = this.scenario.page;
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
    opts?: PageFnOptions,
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

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const el = await this.clear(selector);
      await el.type(textToType, opts);
      return el;
    });
  }

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const el = await this.find(selector);
      await el.type(textToType, opts);
      return el;
    });
  }

  public clear(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const el = await this.find(selector);
      await el.clear();
      return el;
    });
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
