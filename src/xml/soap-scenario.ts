import { HttpRequest } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { CONTENT_TYPE_SOAP } from "../interfaces/constants";
import { KeyValue } from "../interfaces/generic-types";
import { HttpRequestOptions } from "../interfaces/http";
import { Scenario } from "../scenario";
import { SoapResponse } from "./soap-response";

export class SoapScenario extends Scenario {
  public readonly typeName = "SOAP";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: SoapResponse = new SoapResponse(this);

  protected _getDefaultRequestOptions(): HttpRequestOptions {
    const headers: KeyValue = {};
    headers["Content-Type"] = CONTENT_TYPE_SOAP;
    return {
      method: "post",
      headers,
    };
  }
}
