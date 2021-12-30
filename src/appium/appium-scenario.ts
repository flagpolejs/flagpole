import { AppiumResponse } from "./appium-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { KeyValue, ClassConstructor } from "../interfaces/generic-types";
import { iSuite, iScenario } from "../interfaces/general.ts";

export class AppiumScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new AppiumResponse(this);

  public constructor(
    public readonly suite: iSuite,
    public readonly title: string,
    public readonly type: ClassConstructor<iScenario>,
    opts: KeyValue
  ) {
    super(suite, title, type, opts);
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
  }
}
