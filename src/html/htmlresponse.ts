import { HTMLElement } from "./htmlelement";
import { HttpResponse } from "../httpresponse";
import { DOMResponse } from "./domresponse";
import {
  iResponse,
  iValue,
  FindAllOptions,
  FindOptions,
  iScenario,
} from "../interfaces";
import * as cheerio from "cheerio";
import { getFindParams, filterFind, wrapAsValue, findOne } from "../helpers";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";

export class HtmlResponse extends DOMResponse implements iResponse {
  private _cheerio: cheerio.Root | null = null;

  protected set cheerio(value: cheerio.Root) {
    this._cheerio = value;
  }

  protected get cheerio(): cheerio.Root {
    if (this._cheerio === null) {
      throw "Cheerio root element is null";
    }
    return this._cheerio;
  }

  public get responseTypeName(): string {
    return "HTML";
  }

  public get responseType(): ScenarioType {
    return "html";
  }

  public get currentUrl(): iValue {
    return wrapAsValue(this.context, this._currentUrl, "Current URL");
  }

  public init(res: HttpResponse) {
    super.init(res);
    this._cheerio = cheerio.load(res.body);
  }

  public getRoot(): cheerio.Root {
    return this.cheerio;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const params = getFindParams(a, b);
      if (params.contains || params.matches || params.opts) {
        return findOne(this, selector, params);
      }
      const selection: cheerio.Cheerio = this.cheerio(selector);
      return selection.length > 0
        ? await HTMLElement.create(
            selection.eq(0),
            this.context,
            null,
            selector
          )
        : wrapAsValue(this.context, null, selector);
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const response: HtmlResponse = this;
    const elements: cheerio.Cheerio = this.cheerio(selector);
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

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const el = await this.find(selector);
      const currentValue = await el.getValue();
      el.setValue(currentValue + textToType);
      return el;
    });
  }

  public clear(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const el = await this.find(selector);
      el.setValue("");
      return el;
    });
  }
}
