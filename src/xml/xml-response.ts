import { HttpResponse } from "../http/http-response";
import { HtmlResponse } from "../html/html-response";
import * as cheerio from "cheerio";
import { ValuePromise } from "../value-promise";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { CheerioElement, HTMLElement } from "../html/html-element";

export class XmlResponse extends HtmlResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.cheerio = cheerio.load(httpResponse.body, {
      xmlMode: true,
    });
  }

  private normalizeSelector(selector: string): string {
    return selector.replace(/([a-z0-9]):([a-z0-9])/gi, "$1\\:$2");
  }

  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise<CheerioElement, HTMLElement> {
    return super.find(this.normalizeSelector(selector), a, b);
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<HTMLElement[]> {
    return super.findAll(this.normalizeSelector(selector), a, b);
  }
}
