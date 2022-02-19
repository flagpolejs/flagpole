import { Scenario, Suite } from "..";

export type ScenarioMapper = (
  value: any,
  index: number,
  arr: any[],
  suite: Suite
) => Scenario;
