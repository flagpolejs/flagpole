import { JsonResponse } from "./json-response";
import { Scenario } from "../scenario";
import { HttpRequestOptions } from "../interfaces/http";
import { CONTENT_TYPE_JSON } from "../interfaces/constants";
import { NeedleAdapter } from "../adapter.needle";
import { HttpRequest } from "..";

export class JsonScenario extends Scenario<
  HttpRequest,
  NeedleAdapter,
  JsonResponse
> {
  public readonly typeName: string = "JSON";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter: NeedleAdapter = new NeedleAdapter();
  public readonly response: JsonResponse = new JsonResponse(this);
  public readonly defaultRequestOptions: HttpRequestOptions = {
    headers: {
      "Content-Type": CONTENT_TYPE_JSON,
    },
    method: "get",
  };
}
