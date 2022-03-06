import { ProtoResponse } from "../proto-response";
import { HttpResponse } from "../http/http-response";
import { JsonDoc, jsonFind, jsonFindAll, JsonProvider } from "./jpath";

export class JsonResponse extends ProtoResponse implements JsonProvider {
  public json?: JsonDoc;

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.json = new JsonDoc(httpResponse.jsonBody);
    if (httpResponse.statusCode == 204) {
      this.context
        .assert(
          "Response body should be empty with Status Code 204",
          httpResponse.body.length
        )
        .equals(0);
    } else {
      this.context
        .assert(
          `${this.scenario.typeName} data is valid.`,
          httpResponse.jsonBody
        )
        .type.not.equals("null");
    }
  }

  public find = (path: string) => jsonFind(this, path);
  public findAll = (path: string) => jsonFindAll(this, path);
}
