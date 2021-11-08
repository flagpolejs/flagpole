import { iResponse, iValue } from "../interfaces";
import { HttpResponse } from "../httpresponse";
import HLS from "parse-hls";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "../json/jpath";
import { MediaResponse } from "./media-response";

export class HLSResponse
  extends MediaResponse
  implements iResponse, JPathProvider
{
  public jsonDoc: JsonDoc | undefined;
  protected _mimePattern = /mpegurl/i;

  public get responseTypeName(): string {
    return "HLS Video";
  }

  public get responseType(): ScenarioType {
    return "hls";
  }

  public get jsonBody(): iValue {
    return this.wrapAsValue(
      this.context,
      this.jsonDoc?.root,
      "Parsed Manifest"
    );
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
