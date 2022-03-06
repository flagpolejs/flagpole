import { HttpRequest, Value } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends Scenario {
  public readonly typeName = "Generic Resource";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: ResourceResponse = new ResourceResponse(this);
}
