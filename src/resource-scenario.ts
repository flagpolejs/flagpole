import { fetchWithNeedle } from "./adapters/needle";
import { ProtoScenario } from "./scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends ProtoScenario {
  protected createResponse() {
    return new ResourceResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
