import { JsonResponse } from "./json-response";
import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { CONTENT_TYPE_JSON, HttpRequestOptions, KeyValue } from "../interfaces";

export class JsonScenario extends ProtoScenario {
  protected createResponse() {
    return new JsonResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_JSON;
    return {
      method: "get",
      headers,
    };
  }
}
