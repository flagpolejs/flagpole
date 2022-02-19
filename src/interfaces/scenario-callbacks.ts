import { Scenario, Suite } from "..";
import { ScenarioStatusEvent } from "./enums";
import { ScenarioInitOptions } from "./scenario-init-options";

export type ScenarioStatusCallback = (
  scenario: Scenario,
  status: ScenarioStatusEvent
) => any;

export type ScenarioAsyncCallback = (
  scenario: Scenario,
  suite: Suite
) => Promise<void>;
export type ScenarioSyncCallback = (scenario: Scenario, suite: Suite) => void;
export type ScenarioCallback = ScenarioAsyncCallback | ScenarioSyncCallback;
export type ScenarioCallbackAndMessage = {
  message: string;
  callback: ScenarioCallback;
};

export type ScenarioTemplateInitOptions<T extends Scenario> = Omit<
  ScenarioInitOptions<T>,
  "type"
>;
