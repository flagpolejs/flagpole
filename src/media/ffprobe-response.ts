import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http/http-response";
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
  implements iResponse, JPathProvider {}
