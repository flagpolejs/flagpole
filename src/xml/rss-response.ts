import { HttpResponse } from "../http/http-response";
import { XmlResponse } from "./xml-response";
import * as cheerio from "cheerio";

const validMimeTypes = ["application/rss+xml", "text/xml", "text/rss+xml"];

export class RssResponse extends XmlResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert(this.statusCode).between(200, 299);
    const mimeType = String(this.header("Content-Type").$)
      .split(";")
      .shift()
      ?.trim();
    this.context
      .assert(
        `Mime Type is valid for RSS (${validMimeTypes.join(", ")})`,
        mimeType
      )
      .in(validMimeTypes);
    this.context
      .assert("Has required RSS 2.0 fields", this.hasRequiredRss2Fields())
      .equals(true);
  }

  private hasRequiredRss2Fields(): boolean {
    // Must be one channel and one rss tag
    const rss = this.cheerio("rss");
    const channel = rss.children("channel");
    if (rss.length !== 1 || channel.length != 1) {
      return false;
    }
    // Channel must have title, link and description
    const channelLink = channel.children("link");
    const channelTitle = channel.children("title");
    const channelDesc = channel.children("description");
    if (
      channelLink.length !== 1 ||
      channelTitle.length != 1 ||
      channelDesc.length != 1
    ) {
      return false;
    }
    // Check items
    const items = channel.children("item");
    if (items.length > 0) {
      let allItemsAreValid: boolean = true;
      items.each((i, item) => {
        const itemTitle = cheerio(item).children("title");
        const itemDesc = cheerio(item).children("description");
        if (itemTitle.length == 0 && itemDesc.length == 0) {
          allItemsAreValid = false;
          return false;
        }
      });
      if (!allItemsAreValid) {
        return false;
      }
    }
    // Made it this far? Valid;
    return true;
  }
}
