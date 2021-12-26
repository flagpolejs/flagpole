import { fetchWithNeedle } from "../adapters/needle";
import { CONTENT_TYPE_SOAP, HttpRequestOptions, KeyValue } from "../interfaces";
import { ProtoScenario } from "../scenario";
import { SoapResponse } from "./soap-response";

export class SoapScenario extends ProtoScenario {
  protected createResponse() {
    return new SoapResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_SOAP;
    return {
      method: "post",
      headers,
    };
  }
}
