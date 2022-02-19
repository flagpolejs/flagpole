import { JsonResponse } from "./json-response";
import { Scenario } from "../scenario";
import { HttpRequestOptions } from "../interfaces/http";
import { CONTENT_TYPE_JSON } from "../interfaces/constants";
import { NeedleAdapter } from "../adapter.needle";
import { AssertionContext, Value } from "..";

export class JsonScenario extends Scenario {
  public readonly typeName = "JSON";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    JsonResponse,
    Value
  );
  public readonly defaultRequestOptions: HttpRequestOptions = {
    headers: {
      "Content-Type": CONTENT_TYPE_JSON,
    },
    method: "get",
  };
}
