import { iResponse, iValue } from "../interfaces/general";
import { HttpResponse } from "../http-response";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "../json/jpath";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { JsonResponse } from "../json/json-response";
import { ScenarioType } from "../scenario-types";
import { KeyValue } from "../interfaces/generic-types";
import { FfprobeData } from "media-probe";

export interface ffprobeResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  probeData: FfprobeData;
}

export class FfprobeResponse
  extends JsonResponse
  implements iResponse, JPathProvider
{
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "FFprobe Data";
  }

  public get responseType(): ScenarioType {
    return "ffprobe";
  }

  public get jsonBody(): iValue {
    return wrapAsValue(this.context, this.jsonDoc?.root, "FFprobe Data");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    try {
      this.jsonDoc = new JsonDoc(httpResponse.json);
    } catch (ex) {
      this.context.logFailure("Error parsing ffprobe output.", ex);
    }
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
