import { ProtoResponse, Scenario, Value } from "..";
import { Adapter } from "../adapter";
import { AssertionContext } from "../assertion/assertion-context";

export type NextCallback = <
  ScenarioType extends Scenario,
  AdapterType extends Adapter,
  ResponseType extends ProtoResponse,
  WrapperType extends Value
>(
  context: AssertionContext<
    ScenarioType,
    AdapterType,
    ResponseType,
    WrapperType
  >,
  ...args: any[]
) => Promise<any> | void;
