import { HTMLElement } from "./html-element";
import { HttpResponse } from "../http/http-response";
import { iValue } from "../interfaces/ivalue";
import * as cheerio from "cheerio";
import { getFindParams, filterFind, findOne } from "../helpers";
import { ValuePromise } from "../value-promise";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { ProtoResponse } from "../response";

export class HtmlResponse extends ProtoResponse {
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

  public init(res: HttpResponse) {
    super.init(res);
    this._cheerio = cheerio.load(res.body);
  }

  public getRoot(): cheerio.Root {
    return this.cheerio;
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
        ? await HTMLElement.create(selection.eq(0)[0], this.context, {
            selector,
          })
        : this.valueFactory.createNull({ selector });
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue<cheerio.Element>[]> {
    const elements: cheerio.Element[] = this.cheerio(selector).toArray();
    const params = getFindParams(a, b);
    let nodeElements: iValue<cheerio.Element>[] = [];
    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        nodeElements.push(
          await HTMLElement.create(elements[i], this.context, {
            name: `${selector} [${i}]`,
            selector,
          })
        );
      }
      if (params.opts || params.contains || params.matches) {
        nodeElements = (await filterFind(
          nodeElements,
          params.contains || params.matches,
          params.opts
        )) as HTMLElement<cheerio.Element>[];
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
