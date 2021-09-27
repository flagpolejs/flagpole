import { URL } from "url";
import { iAssertionContext } from "./interfaces";
import { toType } from "./util";

const isValidDataUrl = require("valid-data-url");

export class Link {
  protected _context: iAssertionContext;
  protected _uri: string;
  protected _qs: any;

  constructor(uri: string, context: iAssertionContext) {
    this._uri = uri;
    this._context = context;
  }

  /**
   * Get full URL including host, optionally add query string
   *
   * @param queryString
   */
  public getUri(): string {
    const baseUrl: URL = this._context.scenario.buildUrl();
    const thisUrl: URL = new URL(this._uri, baseUrl.href);
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
    return isValidDataUrl(this._uri);
  }

  public isData(): boolean {
    return /^data:/.test(this._uri);
  }

  public isAnchor(): boolean {
    return /^#/.test(this._uri);
  }

  public isEmail(): boolean {
    return /^mailto:/.test(this._uri);
  }

  public isPhone(): boolean {
    return /^(tel|callto|wtai):/.test(this._uri);
  }

  public isTextMessage(): boolean {
    return /^(sms|mms):/.test(this._uri);
  }

  public isGeo(): boolean {
    return /^(geo|geopoint):/.test(this._uri);
  }

  public isScript(): boolean {
    return /^(javascript):/.test(this._uri);
  }

  public isAppStore(): boolean {
    return /^(market|itms|itms-apps):/.test(this._uri);
  }

  public isFtp(): boolean {
    return /^(ftp):/.test(this._uri);
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
      this._uri.length > 0 &&
      !this.isAnchor() &&
      (/^\?/.test(this._uri) || // Starts with a question mark
        /^https?:\/\//i.test(this._uri) || // Starts with http:// or https://
        /^\//i.test(this._uri) || // Starts with as slash
        !/^[a-z]+:\/\//i.test(this._uri)) // Not any other weird protocol
    );
  }
}
