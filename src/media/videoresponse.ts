import { iResponse } from "../interfaces";
import { ScenarioType } from "../scenario-types";
import { MediaResponse } from "./mediaresponse";

export class VideoResponse extends MediaResponse implements iResponse {
  public get responseTypeName(): string {
    return "Video";
  }

  public get responseType(): ScenarioType {
    return "video";
  }

  protected _mimePattern = /(video)/i;
}
