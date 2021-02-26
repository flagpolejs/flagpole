import { HttpResponse } from "../httpresponse";
import { iResponse } from "../interfaces";
import { HtmlResponse } from "../html/htmlresponse";
import * as cheerio from "cheerio";
import { ScenarioType } from "../scenario-types";

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
}
