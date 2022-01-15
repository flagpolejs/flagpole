import { JsonResponse } from "./json-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { HttpRequestOptions } from "../interfaces/http";
import { CONTENT_TYPE_JSON } from "../interfaces/constants";

export class JsonScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new JsonResponse(this);
  public readonly defaultRequestOptions: HttpRequestOptions = {
    headers: {
      "Content-Type": CONTENT_TYPE_JSON,
    },
    method: "get",
  };
}
