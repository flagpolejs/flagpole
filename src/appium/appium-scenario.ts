import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { appiumSessionCreate, appiumSessionDestroy } from "./appium-helpers";
import { AppiumResponse } from "./appium-response";

export class AppiumScenario extends ProtoScenario {
  protected responseClass = AppiumResponse;
  protected requestAdapter = fetchWithNeedle;

  protected _createResponse(opts: any = {}) {
    this.before(appiumSessionCreate(this, opts))
      .after(appiumSessionDestroy(this))
      .open("/");
    return new AppiumResponse(this);
  }
}
