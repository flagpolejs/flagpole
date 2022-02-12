import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends ProtoScenario<AtomResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new AtomResponse(this);
  public readonly typeName = "Atom";
}
