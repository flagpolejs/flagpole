import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends ProtoScenario<ResourceResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new ResourceResponse(this);
  public readonly typeName = "Generic Resource";
}
