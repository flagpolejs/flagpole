import { fetchWithNeedle } from "../http/needle";
import { ProtoScenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new AtomResponse(this);
  public readonly typeName = "Atom";
}
