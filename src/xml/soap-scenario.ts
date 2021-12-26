import { fetchWithNeedle } from "../adapters/needle";
import { CONTENT_TYPE_SOAP, HttpRequestOptions, KeyValue } from "../interfaces";
import { ProtoScenario } from "../scenario";
import { SoapResponse } from "./soap-response";

export class SoapScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new SoapResponse(this);

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_SOAP;
    return {
      method: "post",
      headers,
    };
  }
}
