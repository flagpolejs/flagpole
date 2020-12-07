import { ResponseType } from "../enums";
import { iResponse, iValue } from "../interfaces";
import { HttpResponse } from "../httpresponse";
import HLS from "parse-hls";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "../json/jpath";
import { wrapAsValue } from "../helpers";
import { VideoResponse } from "./videoresponse";
import { ValuePromise } from "../value-promise";

export class HLSResponse
  extends VideoResponse
  implements iResponse, JPathProvider {
  public jsonDoc: JsonDoc | undefined;
  protected _mimePattern = /mpegurl/i;

  public get responseTypeName(): string {
    return "HLS Video";
  }

  public get responseType(): ResponseType {
    return "hls";
  }

  public get jsonBody(): iValue {
    return wrapAsValue(this.context, this.jsonDoc?.root, "Parsed Manifest");
  }

  protected get isM3U8(): boolean {
    return this.body.toString().trim().startsWith("#EXTM3U");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context
      .assert("Content looks like M3U format", this.isM3U8)
      .equals(true);
    try {
      const manifest = HLS.parse(this.body.toString());
      this.jsonDoc = new JsonDoc(manifest.serialize());
    } catch (ex) {
      this.context.logFailure("Error parsing HLS manifest.", ex);
    }
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
