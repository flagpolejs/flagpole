import { ProtoResponse } from "../response";
import { iResponse, iValue, FindOptions, FindAllOptions } from "../interfaces";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { wrapAsValue } from "../helpers";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "../json/jpath";
import { sendAppiumRequest } from "./appium-helpers";
import { AppiumElement } from "./appiumelement";

export class AppiumResponse extends ProtoResponse implements iResponse {
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "Appium";
  }

  public get responseType(): ScenarioType {
    return "appium";
  }

  public getRoot(): any {
    return this.jsonBody.$;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not support eval.";
  }

  public find(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const usingValue = selector.split("/");
      const res = await sendAppiumRequest(
        this.scenario,
        `/session/${this.scenario.get("sessionId")}/element`,
        {
          method: "post",
          data: {
            using: usingValue[0],
            value: usingValue[1],
          },
        }
      );
      if (res.jsonRoot.value.ELEMENT) {
        const element = new AppiumElement(
          selector,
          this.context,
          selector,
          res.jsonRoot.value.ELEMENT
        );
        return element;
      } else {
        return wrapAsValue(this.context, null, selector);
      }
    });
  }
}
