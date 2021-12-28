import { JsonResponse } from "./json-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { CONTENT_TYPE_JSON, HttpRequestOptions, KeyValue } from "../interfaces";

export class JsonScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new JsonResponse(this);

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_JSON;
    return {
      method: "get",
      headers,
    };
  }
}
