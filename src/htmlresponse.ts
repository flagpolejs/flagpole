import { HTMLElement } from "./htmlelement";
import { HttpResponse } from "./httpresponse";
import { DOMResponse } from "./domresponse";
import { iResponse } from "./interfaces";
import { ResponseType } from "./enums";
import { iValue } from ".";

const cheerio: CheerioAPI = require("cheerio");
let $: CheerioStatic;

export class HtmlResponse extends DOMResponse implements iResponse {
  public get responseTypeName(): string {
    return "HTML";
  }

  public get responseType(): ResponseType {
    return ResponseType.html;
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    $ = cheerio.load(httpResponse.body);
  }

  public getRoot(): CheerioStatic {
    return $;
  }

  public async evaluate(context: any, callback: Function): Promise<any> {
    return callback.apply(context, [$]);
  }

  public async find(path: string): Promise<HTMLElement | iValue> {
    const selection: Cheerio = $(path);
    if (selection.length > 0) {
      return await HTMLElement.create(
        selection.eq(0),
        this.context,
        null,
        path
      );
    } else {
      return this._wrapAsValue(null, path);
    }
  }

  public async findAll(path: string): Promise<HTMLElement[]> {
    const response: iResponse = this;
    const elements: Cheerio = $(path);
    if (elements.length > 0) {
      const nodeElements: HTMLElement[] = [];
      await elements.each(async function(i: number) {
        nodeElements.push(
          await HTMLElement.create(
            $(elements.get(i)),
            response.context,
            `${path} [${i}]`,
            path
          )
        );
      });
      return nodeElements;
    } else {
      return [];
    }
  }

  public async waitForHidden(
    selector: string,
    timeout: number = 100
  ): Promise<HTMLElement | iValue> {
    return this.find(selector);
  }

  public async waitForVisible(
    selector: string,
    timeout: number = 100
  ): Promise<HTMLElement | iValue> {
    return this.find(selector);
  }

  public async waitForExists(
    selector: string,
    timeout: number = 100
  ): Promise<HTMLElement | iValue> {
    return this.find(selector);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    return await this.evaluate(this, function($) {
      let currentValue = $(selector).val();
      $(selector).val(currentValue + textToType);
    });
  }

  public async clear(selector: string): Promise<any> {
    return await this.evaluate(this, function($: Cheerio) {
      $.find(selector).val("");
    });
  }
}
