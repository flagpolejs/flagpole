import { NeedleAdapter } from "../adapter.needle";
import { CONTENT_TYPE_SOAP } from "../interfaces/constants";
import { KeyValue } from "../interfaces/generic-types";
import { HttpRequestOptions } from "../interfaces/http";
import { Scenario } from "../scenario";
import { SoapResponse } from "./soap-response";

export class SoapScenario extends Scenario<SoapResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new SoapResponse(this);
  public readonly typeName = "SOAP";

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_SOAP;
    return {
      method: "post",
      headers,
    };
  }
}
