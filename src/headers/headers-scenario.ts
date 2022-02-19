import { HeadersResponse } from "./headers-response";
import { Scenario } from "../scenario";
import { NeedleAdapter } from "../adapter.needle";
import { AssertionContext, Value } from "..";

export class HeadersScenario extends Scenario {
  public readonly typeName = "Headers";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    HeadersResponse,
    Value
  );

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
