import { HttpResponse } from "../http-response";
import { iResponse } from "../interfaces/general";
import { HtmlResponse } from "../html/html-response";
import * as cheerio from "cheerio";
import { ScenarioType } from "../scenario-types";
import { ValuePromise } from "../value-promise";
import { iValue } from "..";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";

export class XmlResponse extends HtmlResponse implements iResponse {
  public get responseTypeName(): string {
    return "XML";
  }

  public get responseType(): ScenarioType {
    return "xml";
  }

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
  ): ValuePromise {
    return super.find(this.normalizeSelector(selector), a, b);
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    return super.findAll(this.normalizeSelector(selector), a, b);
  }
}
