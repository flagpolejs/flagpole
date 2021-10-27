import { ProtoResponse } from "../response";
import { iResponse, iValue, FindOptions, FindAllOptions } from "../interfaces";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "../json/jpath";
import { sendAppiumRequest } from "./appium-helpers";

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
      this.jsonDoc = res;
      return jpathFind(this, "value.ELEMENT");
    });
  }

  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);

  public click = (elementId: string | undefined): ValuePromise => {
    return ValuePromise.execute(async () => {
      const res = await sendAppiumRequest(
        this.scenario,
        `/session/${this.scenario.get("sessionId")}/element/${elementId}/click`,
        {
          method: "post",
        }
      );

      if (res.jsonRoot.value === "null") {
        res.jsonRoot.value = "Success";
      } else {
        res.jsonRoot.value = null;
      }

      this.jsonDoc = res;
      return jpathFind(this, "value");
    });
  };
}
