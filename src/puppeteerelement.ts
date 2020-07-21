import { iValue, iAssertionContext } from "./interfaces";
import { JSHandle, ElementHandle, EvaluateFn, Page } from "puppeteer-core";
import { DOMElement } from "./domelement";

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

  protected _eval(js: EvaluateFn<any>, arg?: any): Promise<any> {
    return this._page.evaluate(js, arg);
  }

  protected async _getProperty(key: string) {
    return (await this._input.getProperty(key)).jsonValue();
  }
}
