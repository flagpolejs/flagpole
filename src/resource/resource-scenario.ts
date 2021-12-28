import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new ResourceResponse(this);
}
