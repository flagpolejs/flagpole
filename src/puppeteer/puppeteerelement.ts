import { iValue, iAssertionContext } from "../interfaces";
import {
  JSHandle,
  ElementHandle,
  EvaluateFn,
  Page,
  PageFnOptions,
  SerializableOrJSHandle,
} from "puppeteer-core";
import { DOMElement } from "../html/domelement";

export abstract class PuppeteerElement extends DOMElement implements iValue {
  protected abstract _input: ElementHandle | JSHandle;
  public abstract get $(): ElementHandle | JSHandle;

  protected get _page(): Page {
    if (this.context.page === null) {
      throw "Puppeteer page object was not found.";
    }
    return this.context.page;
  }

  protected constructor(
    input: JSHandle | ElementHandle,
    context: iAssertionContext,
    name: string,
    path?: string
  ) {
    super(input, context, name, path);
  }

  public toString(): string {
    return String(this.path);
  }

  public async clearThenType(
    textToType: string,
    opts: any = {}
  ): Promise<iValue> {
    await this.clear();
    await this.type(textToType, opts);
    return this;
  }

  public async eval(js: string): Promise<any> {
    return this._eval(js);
  }

  public async waitForFunction(
    js: EvaluateFn<any>,
    timeout: number,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue>;
  public async waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue>;
  public async waitForFunction(
    js: EvaluateFn<any>,
    a?: PageFnOptions | number,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue> {
    const opts: PageFnOptions = typeof a == "number" ? { timeout: a } : a || {};
    try {
      await this._page.waitForFunction.apply(this._page, [
        js,
        opts,
        ...[this.$, ...args],
      ]);
      this._completedAction("WAIT", this.name);
    } catch {
      this._failedAction("WAIT", this.name);
    }
    return this;
  }

  public async waitForHidden(timeout?: number): Promise<iValue> {
    return this;
  }

  public async waitForVisible(timeout?: number): Promise<iValue> {
    return this;
  }

  protected async _getSourceCode(): Promise<string> {
    this._sourceCode = await this._getOuterHtml();
    return this._sourceCode;
  }

  protected _eval(js: EvaluateFn<any>, arg?: any): Promise<any> {
    return this._page.evaluate(js, arg);
  }

  protected async _getProperty(key: string) {
    return (await this._input.getProperty(key)).jsonValue();
  }

  protected async _waitForIt(fn: EvaluateFn, verb: string, timeout?: number) {
    try {
      await this._waitForFunction(fn, timeout);
      this._completedAction(verb.toUpperCase(), this.name);
    } catch (e) {
      this._failedAction(verb.toUpperCase(), this.name);
    }
    return this;
  }

  protected async _waitForFunction(fn: EvaluateFn, timeout?: number) {
    const opts = {
      timeout: timeout,
    };
    await this._page.waitForFunction(fn, opts, this.$);
    return this;
  }
}
