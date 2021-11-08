import { fetchWithNeedle } from "./adapters/needle";
import { ResourceResponse } from "./resourceresponse";
import { ProtoScenario } from "./scenario";

export class ResourceScenario extends ProtoScenario {
  protected responseClass = ResourceResponse;
  protected requestAdapter = fetchWithNeedle;
}
