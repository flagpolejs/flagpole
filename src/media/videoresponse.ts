import { ResponseType } from "../enums";
import { iResponse, iValue } from "../interfaces";
import { ProtoResponse } from "../response";
import { HttpResponse } from "../httpresponse";
import { ValuePromise } from "../value-promise";
import HLS from "parse-hls";
import { iJPath, jPath } from "../json/jpath";
import { wrapAsValue } from "../helpers";

enum FILE_TYPE {
  "m3u8" = "m3u8",
  "ts" = "ts",
}

const FILE_EXT_TO_TYPE = {
  m3u8: FILE_TYPE.m3u8,
  m3u: FILE_TYPE.m3u8,
};

export class VideoResponse extends ProtoResponse implements iResponse {
  public get responseTypeName(): string {
    return "Video";
  }

  public get responseType(): ResponseType {
    return "video";
  }

  protected get extension(): string {
    return (
      this.finalUrl.toURL().pathname.split(".").pop() || ""
    ).toLowerCase();
  }

  protected get extensionType(): FILE_TYPE {
    return FILE_EXT_TO_TYPE[this.extension];
  }

  protected get isM3U8(): boolean {
    return this.body.toString().trim().startsWith("#EXTM3U");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    if (this.extensionType == FILE_TYPE.m3u8) {
    }
    this.context.assert("HTTP Status OK", this.statusCode).between(200, 299);
    this.context
      .assert(
        "MIME Type matches expected value for video",
        this.header("Content-Type")
      )
      .matches(/(video|mpegurl)/i);
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(path: string): ValuePromise {
    throw "This type of scenario does not suport find.";
  }

  public async findAll(path: string): Promise<iValue[]> {
    throw "This type of scenario does not suport findAll.";
  }
}
