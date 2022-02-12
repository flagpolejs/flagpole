import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends Scenario<AtomResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new AtomResponse(this);
  public readonly typeName = "Atom";
}
