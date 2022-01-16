import { fetchWithNeedle } from "../http/needle";
import { ProtoScenario } from "../scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new ResourceResponse(this);
  public readonly typeName = "Generic Resource";
}
