import { JsonResponse } from "../json/json-response";
import { KeyValue } from "../interfaces/generic-types";
import { FfprobeData } from "media-probe";

export interface ffprobeResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  probeData: FfprobeData;
}

export class FfprobeResponse extends JsonResponse {}
