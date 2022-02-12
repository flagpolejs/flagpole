import { JsonResponse } from "./json-response";
import { ProtoScenario } from "../scenario";
import { HttpRequestOptions } from "../interfaces/http";
import { CONTENT_TYPE_JSON } from "../interfaces/constants";
import { NeedleAdapter } from "../adapter.needle";

export class JsonScenario extends ProtoScenario<JsonResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new JsonResponse(this);
  public readonly typeName = "JSON";
  public readonly defaultRequestOptions: HttpRequestOptions = {
    headers: {
      "Content-Type": CONTENT_TYPE_JSON,
    },
    method: "get",
  };
}
