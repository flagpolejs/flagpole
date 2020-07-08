import { iValue, iAssertionContext } from "./interfaces";
import { JSHandle, ElementHandle, EvaluateFn } from "puppeteer-core";
import { DOMElement } from "./domelement";

export abstract class PuppeteerElement extends DOMElement implements iValue {
  protected abstract _input: ElementHandle | JSHandle;
  public abstract get $(): ElementHandle | JSHandle;

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
  ): Promise<void> {
    await this.clear();
    await this.type(textToType, opts);
  }

  public async eval(js: string): Promise<any> {
    return this._eval(js);
  }

  protected async _getSourceCode(): Promise<string> {
    this._sourceCode = await this._getOuterHtml();
    return this._sourceCode;
  }

  protected async _eval(js: EvaluateFn<any>, arg?: any): Promise<any> {
    if (this._context.page !== null) {
      return await this._context.page.evaluate(js, arg);
    }
    throw new Error("Page was null.");
  }

  protected async _getProperty(key: string) {
    return (await this._input.getProperty(key)).jsonValue();
  }
}
