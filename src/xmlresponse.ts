import { HttpResponse } from "./httpresponse";
import { iResponse } from "./interfaces";
import { ResponseType } from "./enums";
import { HtmlResponse } from "./htmlresponse";
import * as cheerio from "cheerio";

export class XmlResponse extends HtmlResponse implements iResponse {
  public get responseTypeName(): string {
    return "XML";
  }

  public get responseType(): ResponseType {
    return "xml";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.cheerio = cheerio.load(httpResponse.body, {
      xmlMode: true,
    });
  }
}
