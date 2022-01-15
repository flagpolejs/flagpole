import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http-response";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "../json/jpath";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { JsonResponse } from "../json/json-response";
import { KeyValue } from "../interfaces/generic-types";
import { FfprobeData } from "media-probe";
import { iValue } from "..";

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

  public readonly responseTypeName = "FFprobe Data";

  public get jsonBody(): iValue {
    return wrapAsValue(this.context, this.jsonDoc?.root, "FFprobe Data");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    try {
      this.jsonDoc = new JsonDoc(httpResponse.jsonBody);
    } catch (ex) {
      this.context.logFailure("Error parsing ffprobe output.", ex);
    }
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
