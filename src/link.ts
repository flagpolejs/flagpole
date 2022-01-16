import { URL } from "url";
import { toType } from "./helpers";

const isValidDataUrl = require("valid-data-url");

export class Link {
  protected _qs: any;

  constructor(protected uri: string, protected baseUrl: URL) {}

  /**
   * Get full URL including host, optionally add query string
   *
   * @param queryString
   */
  public getUri(): string {
    const thisUrl: URL = new URL(this.uri, this.baseUrl.href);
    if (typeof this._qs != "undefined") {
      const type: string = toType(this._qs);
      if (type == "object") {
        for (const key in this._qs) {
          thisUrl.searchParams.append(key, this._qs[key]);
        }
      } else if (type == "array") {
        this._qs.forEach((item) => {
          thisUrl.searchParams.append(item.name, item.value);
        });
      }
    }
    return thisUrl.href;
  }

  public setQueryString(qs: any) {
    this._qs = qs;
  }

  public isValidDataUri(): boolean {
    return isValidDataUrl(this.uri);
  }

  public isData(): boolean {
    return /^data:/.test(this.uri);
  }

  public isAnchor(): boolean {
    return /^#/.test(this.uri);
  }

  public isEmail(): boolean {
    return /^mailto:/.test(this.uri);
  }

  public isPhone(): boolean {
    return /^(tel|callto|wtai):/.test(this.uri);
  }

  public isTextMessage(): boolean {
    return /^(sms|mms):/.test(this.uri);
  }

  public isGeo(): boolean {
    return /^(geo|geopoint):/.test(this.uri);
  }

  public isScript(): boolean {
    return /^(javascript):/.test(this.uri);
  }

  public isAppStore(): boolean {
    return /^(market|itms|itms-apps):/.test(this.uri);
  }

  public isFtp(): boolean {
    return /^(ftp):/.test(this.uri);
  }

  /*
    public isNonNavigation(): boolean {
        return (
            /^(gopher|archie|veronica|telnet|file|nntp|news|irc|spdy|rtmp|rtp|tcp|udp):\/\//i.test(this.uri)
        );
    }
    */

  public isNavigation(): boolean {
    return (
      this.uri.length > 0 &&
      !this.isAnchor() &&
      (/^\?/.test(this.uri) || // Starts with a question mark
        /^https?:\/\//i.test(this.uri) || // Starts with http:// or https://
        /^\//i.test(this.uri) || // Starts with as slash
        !/^[a-z]+:\/\//i.test(this.uri)) // Not any other weird protocol
    );
  }
}
