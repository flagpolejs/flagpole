import { ProtoResponse } from "../response";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "./jpath";
import { iValue } from "..";

export class JsonResponse extends ProtoResponse implements JPathProvider {
  public jsonDoc: JsonDoc | undefined;

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    const jsonBody = httpResponse.jsonBody;
    this.jsonDoc = new JsonDoc(jsonBody);
    if (httpResponse.statusCode == 204) {
      this.context
        .assert(
          "Response body should be empty with Status Code 204",
          httpResponse.body.length
        )
        .equals(0);
    } else {
      this.context
        .assert(`${this.scenario.typeName} data is valid.`, jsonBody)
        .type.not.equals("null");
    }
  }

  public getRoot(): any {
    return this.jsonBody.$;
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue<any>[]> =>
    jpathFindAll(this, path);
}
