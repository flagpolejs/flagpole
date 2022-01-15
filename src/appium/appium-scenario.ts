import { AppiumResponse } from "./appium-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { ClassConstructor, KeyValue } from "../interfaces/generic-types";
import { iSuite } from "../interfaces/isuite";

export class AppiumScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new AppiumResponse(this);

  public constructor(
    public readonly suite: iSuite,
    public readonly title: string,
    public readonly type: ClassConstructor<AppiumScenario>,
    opts: KeyValue
  ) {
    super(suite, title, AppiumScenario, opts);
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
