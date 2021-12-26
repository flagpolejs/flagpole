import { ExtJSResponse } from "./extjs-response";
import { fetchWithNeedle } from "../adapters/needle";
import { BrowserScenario } from "./browser-scenario";

export class ExtJsScenario extends BrowserScenario {
  protected createResponse() {
    return new ExtJSResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
