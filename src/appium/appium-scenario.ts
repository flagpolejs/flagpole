import { AppiumResponse } from "./appium-response";
import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { KeyValue } from "../interfaces";

export class AppiumScenario extends ProtoScenario {
  protected createResponse() {
    return new AppiumResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }

  protected _getRequestOptions(opts: KeyValue = {}): KeyValue {
    this.open("POST /wd/hub/session", {
      data: {
        capabilities: {
          alwaysMatch: {
            ...opts.capabilities,
          },
        },
        devProperties: { ...opts.devProperties },
      },
    });
    return super._getRequestOptions(opts);
  }
}
