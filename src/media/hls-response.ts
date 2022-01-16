import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http/http-response";
import HLS from "parse-hls";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "../json/jpath";
import { MediaResponse } from "./media-response";
import { iValue } from "..";

export class HlsResponse extends MediaResponse implements JPathProvider {
  public jsonDoc: JsonDoc | undefined;
  protected _mimePattern = /mpegurl|octet-stream/i;

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
      const manifest = HLS.parse(httpResponse.body);
      this.jsonDoc = new JsonDoc(manifest.serialize());
    } catch (ex) {
      this.context.logFailure("Error parsing HLS manifest.", ex);
    }
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
