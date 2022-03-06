import { HttpRequest } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends Scenario {
  public readonly typeName = "Atom";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: AtomResponse = new AtomResponse(this);
}
