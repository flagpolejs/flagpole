import { ProtoResponse } from "../response";
import { HttpResponse } from "../httpresponse";
import { iResponse, iValue, FindOptions, FindAllOptions } from "../interfaces";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "../json/jpath";
import { HttpRequest } from "../httprequest";
import { FlagpoleExecution } from "../flagpoleexecution";

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
      const res = await this._findElement(
        this.scenario.get("sessionId"),
        usingValue[0],
        usingValue[1]
      );
      res.json = JSON.parse(res.body);
      this.jsonDoc = new JsonDoc(res.json);
      return jpathFind(this, "value.ELEMENT");
    });
  }

  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);

  public click = (elementId: string | undefined): ValuePromise => {
    return ValuePromise.execute(async () => {
      const req = new HttpRequest({
        method: "post",
        uri: `${this.scenario.suite.baseUrl}session/${this.scenario.get(
          "sessionId"
        )}/element/${elementId}/click`,
      });
      const res = await req.fetch();
      res.json = JSON.parse(res.body);
      if (res.json.value === null) {
        res.json.value = "Success";
      } else {
        res.json.value = null;
      }
      this.jsonDoc = new JsonDoc(res.json);
      return jpathFind(this, "value");
    });
  };

  private async _findElement(
    sessionId: string,
    using: string,
    value: string
  ): Promise<HttpResponse> {
    const domain = this.scenario.suite.baseUrl;
    const req = new HttpRequest({
      method: "post",
      uri: `${domain}session/${sessionId}/element`,
      data: {
        using: using,
        value: value,
      },
    });
    const res = await req.fetch();

    return res;
  }
}
