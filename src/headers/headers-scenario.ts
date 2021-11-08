import { HeadersResponse } from "./headers-response";
import { ProtoScenario } from "../scenario";
import { fetchWithNeedle } from "../adapters/needle";

export class HeadersScenario extends ProtoScenario {
  protected responseClass = HeadersResponse;
  protected requestAdapter = fetchWithNeedle;
}
