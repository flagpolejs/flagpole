import { AssertionContext } from "../assertion/assertion-context";
import { Scenario } from "../scenario";

export type NextCallback<ScenarioType extends Scenario> = (
  context: AssertionContext<ScenarioType>,
  ...args: any[]
) => Promise<any> | void;
