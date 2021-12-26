import { ProtoScenario } from "../scenario";
import { HLSResponse } from "..";
import { fetchWithNeedle } from "../adapters/needle";

export class HlsScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new HLSResponse(this);
}
