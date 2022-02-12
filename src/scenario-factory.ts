import { Suite } from ".";
import { ClassConstructor, KeyValue } from "./interfaces/generic-types";
import { iScenario } from "./interfaces/iscenario";

export const createScenario = <T extends iScenario>(
  suite: Suite,
  title: string,
  scenarioType: ClassConstructor<T>,
  opts: KeyValue
): T => {
  return new scenarioType(suite, title, scenarioType, opts) as T;
};
