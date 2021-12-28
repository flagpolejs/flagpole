import { ProtoScenario } from "../scenario";
import { HLSResponse } from "..";
import { fetchWithNeedle } from "../needle";

export class HlsScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new HLSResponse(this);
}
