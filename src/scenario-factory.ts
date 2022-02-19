import { Scenario, Suite } from ".";
import { ScenarioConstructor } from "./interfaces/constructor-types";
import { KeyValue } from "./interfaces/generic-types";

export const createScenario = <ScenarioType extends Scenario>(
  scenarioType: ScenarioConstructor<ScenarioType>,
  suite: Suite,
  title: string,
  opts: KeyValue
): ScenarioType => {
  return new scenarioType(suite, title, opts, scenarioType);
};
