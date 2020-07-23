import { HTMLElement } from "./htmlelement";
import { HttpResponse } from "../httpresponse";
import { DOMResponse } from "./domresponse";
import { iResponse, iValue, FindAllOptions, FindOptions } from "../interfaces";
import { ResponseType } from "../enums";
import * as cheerio from "cheerio";
import { getFindParams, filterFind, wrapAsValue, findOne } from "../util";

export class HtmlResponse extends DOMResponse implements iResponse {
  private _cheerio: CheerioStatic | null = null;

  protected set cheerio(value: CheerioStatic) {
    this._cheerio = value;
  }

  protected get cheerio(): CheerioStatic {
    if (this._cheerio === null) {
      throw "Cheerio root element is null";
    }
    return this._cheerio;
  }

  public get responseTypeName(): string {
    return "HTML";
  }

  public get responseType(): ResponseType {
    return "html";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this._cheerio = cheerio.load(httpResponse.body);
  }

  public getRoot(): CheerioStatic {
    return this.cheerio;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public async find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): Promise<iValue> {
    const params = getFindParams(a, b);
    if (params.contains || params.matches || params.opts) {
      return findOne(this, selector, params);
    }
    const selection: Cheerio = this.cheerio(selector);
    return selection.length > 0
      ? await HTMLElement.create(selection.eq(0), this.context, null, selector)
      : wrapAsValue(this.context, null, selector);
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const response: HtmlResponse = this;
    const elements: Cheerio = this.cheerio(selector);
    const params = getFindParams(a, b);
    let nodeElements: iValue[] = [];
    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        nodeElements.push(
          await HTMLElement.create(
            this.cheerio(elements.get(i)),
            response.context,
            `${selector} [${i}]`,
            selector
          )
        );
      }
      if (params.opts || params.contains || params.matches) {
        nodeElements = await filterFind(
          nodeElements,
          params.contains || params.matches,
          params.opts
        );
      }
    }
    return nodeElements;
  }

  public async waitForHidden(
    selector: string,
    timeout: number = 100
  ): Promise<iValue> {
    return this.find(selector);
  }

  public async waitForVisible(
    selector: string,
    timeout: number = 100
  ): Promise<iValue> {
    return this.find(selector);
  }

  public async waitForExists(
    selector: string,
    timeout: number = 100
  ): Promise<iValue> {
    return this.find(selector);
  }

  public async waitForHavingText(
    selector: string,
    text: string,
    timeout: number = 100
  ): Promise<iValue> {
    return this.findHavingText(selector, text);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    const currentValue = this.cheerio(selector).val();
    this.cheerio(selector).val(currentValue + textToType);
  }

  public async clear(selector: string): Promise<any> {
    this.cheerio(selector).val("");
  }
}
