import { iScenario } from "../interfaces";
import { AssertionFail } from "../logging/assertion-result";
import { ValuePromise } from "../value-promise";

function cast<T>(val: any): T {
  return val;
}

const scenarioGuard = (
  propertyKey: string,
  descriptor: PropertyDescriptor,
  callback: (scenario: iScenario) => boolean,
  verb: string
) => {
  const method = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const scenario = cast<iScenario>(this);
    if (callback(scenario)) {
      scenario.result(
        new AssertionFail(
          `Can not ${propertyKey} because scenario ${verb}.`,
          null
        )
      );
    } else {
      return method.apply(scenario, args);
    }
  };
};

export function beforeScenarioExecuted(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => s.hasExecuted, "started executing");
}

export function afterScenarioExecuted(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => !s.hasExecuted, "has not started executing");
}

export function beforeScenarioRequestStarted(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => s.hasRequestStarted, "request started executing");
}

export function afterScenarioRequestStarted(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(
    p,
    d,
    (s) => !s.hasRequestStarted,
    "request has not started executing"
  );
}

export function beforeScenarioFinished(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => s.hasFinished, "already finished");
}

export function afterScenarioFinished(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => !s.hasFinished, "has not finished");
}

export function afterScenarioReady(
  t: Object,
  p: string,
  d: PropertyDescriptor
) {
  scenarioGuard(p, d, (s) => !s.isReadyToExecute, "is not ready.");
}
