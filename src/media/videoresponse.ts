import { ResponseType } from "../enums";
import { iResponse } from "../interfaces";
import { MediaResponse } from "./mediaresponse";

export class VideoResponse extends MediaResponse implements iResponse {
  public get responseTypeName(): string {
    return "Video";
  }

  public get responseType(): ResponseType {
    return "video";
  }

  protected _mimePattern = /(video)/i;
}
