import { HttpResponse } from "../http/http-response";
import { XmlResponse } from "./xml-response";

const validMimeTypes = ["application/atom+xml", "text/xml", "text/atom+xml"];

export class AtomResponse extends XmlResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert(this.statusCode).between(200, 299);
    const mimeType = String(this.header("Content-Type").$)
      .split(";")
      .shift()
      ?.trim();
    this.context
      .assert(
        `Mime Type is valid for Atom (${validMimeTypes.join(", ")})`,
        mimeType
      )
      .in(validMimeTypes);
    this.context
      .assert("Has required Atom fields", this.hasRequiredAtomFields())
      .equals(true);
  }

  private hasRequiredAtomFields(): boolean {
    // Must be one channel and one rss tag
    const feed = this.cheerio("feed");
    if (feed.length !== 1) {
      return false;
    }
    // Channel must have title, link and description
    const channelId = feed.children("id");
    const channelTitle = feed.children("title");
    const channelUpdated = feed.children("updated");
    if (
      channelId.length !== 1 ||
      channelTitle.length != 1 ||
      channelUpdated.length != 1
    ) {
      return false;
    }
    // Check items
    const entries = feed.children("entry");
    if (entries.length > 0) {
      let allItemsAreValid: boolean = true;
      entries.each((i, entry) => {
        const id = this.cheerio(entry).children("id");
        const title = this.cheerio(entry).children("title");
        const updated = this.cheerio(entry).children("updated");
        if (id.length !== 1 || title.length !== 1 || updated.length !== 1) {
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
