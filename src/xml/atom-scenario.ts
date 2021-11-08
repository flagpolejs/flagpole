import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { AtomResponse } from "./atomresponse";

export class AtomScenario extends ProtoScenario {
  protected responseClass = AtomResponse;
  protected requestAdapter = fetchWithNeedle;
}
