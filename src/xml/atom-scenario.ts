import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new AtomResponse(this);
}
