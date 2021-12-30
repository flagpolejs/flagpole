import { AppiumResponse } from "./appium-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { KeyValue } from "../interfaces/generic-types";

export class AppiumScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new AppiumResponse(this);

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
