import { JsonResponse } from "./json-response";
import { ProtoScenario } from "../scenario";
import { fetchWithNeedle } from "../adapters/needle";

export class JsonScenario extends ProtoScenario {
  protected responseClass = JsonResponse;
  protected requestAdapter = fetchWithNeedle;
  protected _createResponse() {
    return new JsonResponse(this);
  }
}
