import { AssertionContext, Value } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { ResourceResponse } from "./resource-response";

export class ResourceScenario extends Scenario {
  public readonly typeName = "Generic Resource";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    ResourceResponse,
    Value
  );
}
