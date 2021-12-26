import { JsonResponse } from "./json-response";
import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";

export class JsonScenario extends ProtoScenario {
  protected createResponse() {
    return new JsonResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
