import { iScenario, ProtoResponse, Scenario } from "..";
import { AssertionContext } from "../assertion/assertion-context";

export type NextCallback<
  ScenarioType extends iScenario = iScenario,
  ResponseType extends ProtoResponse = ProtoResponse
> = (
  context: AssertionContext<ScenarioType, ResponseType>,
  ...args: any[]
) => Promise<any> | void;
