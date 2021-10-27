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

  private async _findElement(
    sessionId: string,
    using: string,
    value: string
  ): Promise<HttpResponse> {
    const domain = FlagpoleExecution.global.environment?.defaultDomain || "";
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
