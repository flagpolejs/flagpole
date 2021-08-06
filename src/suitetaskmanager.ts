import {
  iSuite,
  iScenario,
  SuiteStatusCallback,
  SuiteCallback,
  ScenarioCallback,
  SuiteCallbackAndMessage,
  ScenarioCallbackAndMessage,
} from "./interfaces";
import * as bluebird from "bluebird";
import { Scenario } from "./scenario";
import { runAsync } from "./util";

type WhichCallback =
  | "beforeAll"
  | "beforeEach"
  | "afterAll"
  | "afterEach"
  | "success"
  | "failure"
  | "finally";

export class SuiteTaskManager {
  private _suite: iSuite;
  private _scenarios: iScenario[] = [];
  private _dateInitialized: number;
  private _dateStarted: number | null = null;
  private _dateExecutionBegan: number | null = null;
  private _dateExecutionCompleted: number | null = null;
  private _dateFinished: number | null = null;
  private _beforeAllCallbacks: SuiteCallbackAndMessage[] = [];
  private _afterAllCallbacks: SuiteCallbackAndMessage[] = [];
  private _successCallbacks: SuiteCallbackAndMessage[] = [];
  private _failureCallbacks: SuiteCallbackAndMessage[] = [];
  private _finallyCallbacks: SuiteCallbackAndMessage[] = [];
  private _beforeEachCallbacks: ScenarioCallbackAndMessage[] = [];
  private _afterEachCallbacks: ScenarioCallbackAndMessage[] = [];
  private _statusCallbacks: SuiteStatusCallback[] = [];
  private _concurrencyLimit: number = 99;
  private _maxScenarioDuration: number = 30000;
  private _maxTimeToWaitForPendingScenariosToBeReady = 30000;
  private _finishedPromise: Promise<void>;
  private _finishedResolve = () => {};

  public get finished(): Promise<void> {
    return this._finishedPromise;
  }

  public get concurrencyLimit(): number {
    return this._concurrencyLimit;
  }

  public get maxScenarioDuration(): number {
    return this._concurrencyLimit;
  }

  public set concurrencyLimit(value: number) {
    if (this.hasExecutionBegan) {
      throw "Can not change concurrency limit after execution has started.";
    }
    this._concurrencyLimit = value;
  }

  public set maxScenarioDuration(value: number) {
    this._maxScenarioDuration = value;
  }

  public get scenarioCount(): number {
    return this._scenarios.length;
  }

  public get hasStarted(): boolean {
    return this._dateStarted !== null;
  }

  public get hasExecutionBegan(): boolean {
    return this._dateExecutionBegan !== null;
  }

  public get hasExecutionCompleted(): boolean {
    return this._dateExecutionCompleted !== null;
  }

  public get hasFinished(): boolean {
    return this._dateFinished !== null;
  }

  public get canAllSuitesExecute(): boolean {
    return !this._scenarios.some((scenario) => {
      return !scenario.isReadyToExecute;
    });
  }

  public get haveAnyFailed(): boolean {
    return this._scenarios.some((scenario) => {
      return scenario.hasFailed;
    });
  }

  public get haveAllPassed(): boolean {
    return this._scenarios.every((scenario) => {
      return !scenario.hasFailed && scenario.hasFinished;
    });
  }

  public get totalDuration(): number | null {
    return this._dateFinished !== null
      ? this._dateFinished - this._dateInitialized
      : null;
  }

  public get executionDuration(): number | null {
    return this._dateExecutionBegan !== null &&
      this._dateExecutionCompleted !== null
      ? this._dateExecutionCompleted - this._dateExecutionBegan
      : null;
  }

  /**
   * Return a clone of the array of scenarios (can't push into it directly)
   */
  public get scenarios(): iScenario[] {
    return [...this._scenarios];
  }

  public get scenariosNotReadyToExecute(): iScenario[] {
    return this._scenarios.filter((scenario) => {
      return !scenario.isReadyToExecute;
    });
  }

  public get scenariosReadyToExecute(): iScenario[] {
    return this._scenarios.filter((scenario) => {
      return scenario.isReadyToExecute;
    });
  }

  public get scenariosFailed(): iScenario[] {
    return this._scenarios.filter((scenario) => {
      return !scenario.hasPassed && scenario.hasExecuted;
    });
  }

  public get scenariosWaitingToExecute(): iScenario[] {
    return this._scenarios.filter((scenario) => {
      return scenario.isPending;
    });
  }

  public get scenariosCurrentlyExcuting(): iScenario[] {
    return this._scenarios.filter((scenario) => {
      return scenario.hasExecuted && !scenario.hasFinished;
    });
  }

  constructor(suite: iSuite) {
    this._suite = suite;
    this._dateInitialized = Date.now();
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolve = resolve;
    });
  }

  public beforeAll(
    message: string,
    callback: SuiteCallback,
    prepend?: boolean
  ): void;
  public beforeAll(callback: SuiteCallback, prepend?: boolean): void;
  public beforeAll(
    a: SuiteCallback | string,
    b: SuiteCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasStarted) {
      throw "Can not add new beforeAll callback after suite has started running.";
    }
    this._addCallback("beforeAll", a, b, c);
  }

  public beforeEach(
    message: string,
    callback: ScenarioCallback,
    prepend?: boolean
  ): void;
  public beforeEach(callback: ScenarioCallback, prepend?: boolean): void;
  public beforeEach(
    a: ScenarioCallback | string,
    b: ScenarioCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new beforeEach callback after suite has finished running.";
    }
    this._addCallback("beforeEach", a, b, c);
  }

  public afterAll(
    message: string,
    callback: SuiteCallback,
    prepend?: boolean
  ): void;
  public afterAll(callback: SuiteCallback, prepend?: boolean): void;
  public afterAll(
    a: SuiteCallback | string,
    b: SuiteCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new afterAll callback after suite has finished running.";
    }
    this._addCallback("afterAll", a, b, c);
  }

  public afterEach(
    message: string,
    callback: ScenarioCallback,
    prepend?: boolean
  ): void;
  public afterEach(callback: ScenarioCallback, prepend?: boolean): void;
  public afterEach(
    a: ScenarioCallback | string,
    b: ScenarioCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new afterEach callback after suite has finished running.";
    }
    this._addCallback("afterEach", a, b, c);
  }

  public failure(
    message: string,
    callback: SuiteCallback,
    prepend?: boolean
  ): void;
  public failure(callback: SuiteCallback, prepend?: boolean): void;
  public failure(
    a: SuiteCallback | string,
    b: SuiteCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new failure callback after suite has finished running.";
    }
    this._addCallback("failure", a, b, c);
  }

  public success(
    message: string,
    callback: SuiteCallback,
    prepend?: boolean
  ): void;
  public success(callback: SuiteCallback, prepend?: boolean): void;
  public success(
    a: SuiteCallback | string,
    b: SuiteCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new success callback after suite has finished running.";
    }
    this._addCallback("success", a, b, c);
  }

  public finally(
    message: string,
    callback: SuiteCallback,
    prepend?: boolean
  ): void;
  public finally(callback: SuiteCallback, prepend?: boolean): void;
  public finally(
    a: SuiteCallback | string,
    b: SuiteCallback | boolean = false,
    c: boolean = false
  ): void {
    if (this.hasFinished) {
      throw "Can not add new finally callback after suite has finished running.";
    }
    this._addCallback("finally", a, b, c);
  }

  public registerScenario(scenario: iScenario) {
    if (this.hasExecutionCompleted) {
      throw "Can not register new scenario after the suite has completed execution";
    }
    // Add scenario to suite
    this._scenarios.push(scenario);
    // Subscribe to before to fire beforeEach
    scenario.before(() => {
      this._fireScenarioCallbacks(this._beforeEachCallbacks, scenario);
    });
    // Subscribe to after to fire afterEach
    scenario.after(async () => {
      this._fireScenarioCallbacks(this._afterEachCallbacks, scenario);
    });
    // Start executing
    setTimeout(() => {
      this._go();
    }, 10);
  }

  public subscribe(callback: SuiteStatusCallback) {
    this._statusCallbacks.push(callback);
  }

  private async _go() {
    // Only "go" once and only once scenarios are ready
    if (!this.hasStarted && this.scenarioCount > 0) {
      this._dateStarted = Date.now();
      await this._fireSuiteCallbacks(this._beforeAllCallbacks);
      await this._executeScenarios();
      await this._fireSuiteCallbacks(this._afterAllCallbacks);
      this.haveAllPassed
        ? await this._fireSuiteCallbacks(this._successCallbacks)
        : await this._fireSuiteCallbacks(this._failureCallbacks);
      await this._fireSuiteCallbacks(this._finallyCallbacks);
      this._finishedResolve();
    }
  }

  private async _executeScenarios(): Promise<true> {
    if (this.hasExecutionBegan) {
      throw "Execution already started";
    }
    this._dateExecutionBegan = Date.now();
    return new Promise(async (resolve) => {
      const execute = async () => {
        // Execute this batch
        const scenariosExecuting = await this._startExecutingScenarios();
        const finished = await this._waitForScenariosToFinish(
          scenariosExecuting
        );
        // Catch error completing scenarios (typically a timeout)
        if (!finished) {
          return resolve(this._cancelScenariosAnyNotFinished("Timed out"));
        }
        // If there are no more left to execute, we are done
        if (this.scenariosWaitingToExecute.length === 0) {
          return resolve(this._markSuiteExecutionAsCompleted());
        }
        // If last time around, we started some scenarios, execute pending ones
        if (scenariosExecuting.length > 0) {
          return execute();
        }
        // If we have some pending + we didn't start any new ones, kill them
        // Important! Don't finish it off right away, there may be something pending in a few milliseconds
        runAsync(() => {
          // If there are more scenarios now ready to execute, do those
          if (this.scenariosWaitingToExecute.length > 0) {
            return execute();
          }
          // Otherwise, mark any still pending as cancelled
          resolve(this._cancelPendingScenarios("Not able to execute"));
        }, 50);
      };
      await execute();
    });
  }

  private _cancelPendingScenarios(reason: string): true {
    this.scenariosNotReadyToExecute.forEach((scenario) => {
      scenario.cancel(`Cancelled this scenario. Reason: ${reason}`);
    });
    this._markSuiteExecutionAsCompleted();
    return true;
  }

  private _cancelScenariosAnyNotFinished(reason: string): true {
    this.scenarios.forEach((scenario) => {
      if (!scenario.hasFinished) {
        scenario.cancelOrAbort(`Aborted this scenario. Reason: ${reason}`);
      }
    });
    this._markSuiteExecutionAsCompleted();
    return true;
  }

  private async _waitForScenariosToFinish(
    scenarios: iScenario[]
  ): Promise<boolean> {
    try {
      await bluebird
        .all(
          scenarios.map((scenario) => {
            return scenario.waitForFinished();
          })
        )
        .timeout(this._maxScenarioDuration);
    } catch (e) {
      return false;
    }
    return true;
  }

  private async _startExecutingScenarios(): Promise<iScenario[]> {
    return new Promise(async (resolve) => {
      // Execute all scenarios that are ready to go
      const batch = this.scenariosReadyToExecute;
      if (batch.length > 0) {
        await bluebird.map(
          batch,
          async (scenario) => {
            await this._executeScenario(scenario);
            await scenario.waitForFinished();
            // wait for browser to close to avoid overlap and thrown MaxListenersExceededWarning error
            await new Promise(resolve => setTimeout(resolve, 200));
          },
          {
            concurrency: this._concurrencyLimit,
          }
        );
      }
      resolve(batch);
    });
  }

  private _markSuiteExecutionAsCompleted(): true {
    this._dateExecutionCompleted = Date.now();
    return true;
  }

  private async _executeScenario(scenario: iScenario): Promise<iScenario> {
    if (scenario.hasExecuted) {
      throw `Scenario ${scenario.title} has already started executing`;
    }
    if (!scenario.isReadyToExecute) {
      throw `Scenario ${scenario.title} is not ready to execute`;
    }
    await (scenario as Scenario).go();
    return scenario;
  }

  private async _fireSuiteCallbacks(
    callbacks: SuiteCallbackAndMessage[]
  ): Promise<any> {
    return bluebird.mapSeries(callbacks, (callback) => {
      return callback.callback(this._suite);
    });
  }

  private async _fireScenarioCallbacks(
    callbacks: ScenarioCallbackAndMessage[],
    scenario: iScenario
  ): Promise<any> {
    return bluebird.mapSeries(callbacks, (callback) => {
      return callback.callback(scenario, this._suite);
    });
  }

  private _addCallback(
    whichCallback: WhichCallback,
    a: string | SuiteCallback | ScenarioCallback,
    b: SuiteCallback | ScenarioCallback | boolean = false,
    c: boolean = false
  ) {
    const message = typeof a === "string" ? a : "";
    const callback = ((): SuiteCallback | ScenarioCallback => {
      const callback = typeof b === "boolean" ? a : b;
      return typeof callback === "string" ? () => {} : callback;
    })();
    const prepend = typeof b === "boolean" ? b : c;
    const callbackAndMessage = {
      callback: callback,
      message: message,
    };
    const callbackArrayName = `_${whichCallback}Callbacks`;
    prepend
      ? this[callbackArrayName].unshift(callbackAndMessage)
      : this[callbackArrayName].push(callbackAndMessage);
  }
}
