import { ResponseType } from "../enums";
import { iResponse, iValue } from "../interfaces";
import { ProtoResponse } from "../response";
import { HttpResponse } from "../httpresponse";
import { ValuePromise } from "../value-promise";
import HLS from "parse-hls";
import { iJPath, jPath } from "../json/jpath";
import { wrapAsValue } from "../helpers";

export class HLSResponse extends ProtoResponse implements iResponse {
  protected _json: {} = {};
  protected _jPath: iJPath | undefined;

  public get responseTypeName(): string {
    return "HLS Video";
  }

  public get responseType(): ResponseType {
    return "hls";
  }

  public get jsonBody(): iValue {
    return wrapAsValue(this.context, this._json, "Parsed Manifest");
  }

  protected get isM3U8(): boolean {
    return this.body.toString().trim().startsWith("#EXTM3U");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert("HTTP Status OK", this.statusCode).between(200, 299);
    this.context
      .assert(
        "MIME Type matches expected value for HLS Manifest",
        this.header("Content-Type")
      )
      .matches(/mpegurl/i);
    this.context
      .assert("File extension is m3u8 and content matches that", this.isM3U8)
      .equals(true);
    try {
      const manifest = HLS.parse(this.body.toString());
      this._json = manifest.serialize();
    } catch (ex) {
      this.context.logFailure("Error parsing HLS manifest.", ex);
    }
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  /**
   * Find first matching item
   *
   * @param path
   * @param findIn
   */
  public find(path: string): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.loadJmesPath();
      if (typeof this._jPath == "undefined") {
        throw new Error("Could not load jmespath");
      }
      const selection = await this._jPath.search(this._json, path);
      return wrapAsValue(this.context, selection, path, selection);
    });
  }

  /**
   * Same as find for JSON, just returns as array
   *
   * @param path
   */
  public async findAll(path: string): Promise<iValue[]> {
    const item = await this.find(path);
    return [item];
  }

  private async loadJmesPath(): Promise<any> {
    // We haven't tried to load query engines yet
    if (typeof this._jPath == "undefined") {
      // Try importing jmespath
      return (
        import("jmespath")
          // Got it, so save it and return it
          .then((jpath) => {
            this._jPath = jpath;
            return this._jPath;
          })
          // Couldn't load jmespath, so set it to null
          .catch((e) => {
            this._jPath = new jPath();
            return this._jPath;
          })
      );
    } else {
      return this._jPath;
    }
  }
}
