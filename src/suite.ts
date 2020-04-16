import { ResponseType, SuiteStatusEvent } from "./enums";
import { Scenario } from "./scenario";
import { URL } from "url";
import { FlagpoleReport } from "./logging/flagpolereport";
import {
  iSuite,
  iScenario,
  SuiteStatusCallback,
  SuiteErrorCallback,
  SuiteCallback,
  ScenarioCallback,
  SuiteBaseCallback,
} from "./interfaces";
import { exitProcess } from "./util";
import { FlagpoleExecution } from "./flagpoleexecutionoptions";
import { FlagpoleExecutionOptions } from ".";
import { BrowserOptions } from "./httprequest";

/**
 * A suite contains many scenarios
 */
export class Suite implements iSuite {
  public scenarios: Array<iScenario> = [];

  public get suite(): Suite {
    return this;
  }

  public get baseUrl(): URL | null {
    return this._baseUrl;
  }

  public get failCount(): number {
    let count: number = 0;
    this.scenarios.forEach((scenario) => {
      if (!scenario.hasPassed) {
        count += 1;
      }
    });
    return count;
  }

  public get waitingToExecuteCount(): number {
    let count: number = 0;
    this.scenarios.forEach((scenario) => {
      if (!scenario.hasExecuted) {
        count += 1;
      }
    });
    return count;
  }

  public get executingCount(): number {
    let count: number = 0;
    this.scenarios.forEach((scenario) => {
      if (scenario.hasExecuted && !scenario.hasFinished) {
        count += 1;
      }
    });
    return count;
  }

  /**
   * Did every scenario in this suite pass?
   */
  public get hasPassed(): boolean {
    return this.scenarios.every(function (scenario) {
      return scenario.hasPassed;
    });
  }

  /**
   * Did any scenario in this suite fail?
   */
  public get hasFailed(): boolean {
    return this.scenarios.some(function (scenario) {
      return scenario.hasFailed;
    });
  }

  /**
   * Did this suite start running yet?
   */
  public get hasExecuted(): boolean {
    return this._timeSuiteExecuted !== null;
  }

  /**
   * Has this suite finished running?
   */
  public get hasFinished(): boolean {
    return this._timeSuiteFinished !== null;
  }

  /**
   * Total duration in milliseconds from initialization to completion
   */
  public get totalDuration(): number | null {
    return this._timeSuiteFinished !== null
      ? this._timeSuiteFinished - this._timeSuiteInitialized
      : null;
  }

  /**
   * Duration in milliseconds between execution start and completion
   */
  public get executionDuration(): number | null {
    return this._timeSuiteExecuted !== null && this._timeSuiteFinished !== null
      ? this._timeSuiteFinished - this._timeSuiteExecuted
      : null;
  }

  public get title(): string {
    return this._title;
  }

  public get finished(): Promise<void> {
    return this._finishedPromise;
  }

  public get executionOptions(): FlagpoleExecutionOptions {
    return FlagpoleExecution.opts;
  }

  protected _subscribers: SuiteStatusCallback[] = [];
  protected _errorCallbacks: SuiteErrorCallback[] = [];
  protected _successCallbacks: SuiteCallback[] = [];
  protected _failureCallbacks: SuiteCallback[] = [];
  protected _finallyCallbacks: SuiteCallback[] = [];
  protected _beforeAllCallbacks: SuiteCallback[] = [];
  protected _afterAllCallbacks: SuiteCallback[] = [];
  protected _beforeEachCallbacks: ScenarioCallback[] = [];
  protected _afterEachCallbacks: ScenarioCallback[] = [];
  protected _beforeAllPromise: Promise<void>;
  protected _beforeAllResolver: Function = () => {};
  protected _finishedPromise: Promise<void>;
  protected _finishedResolver: Function = () => {};
  protected _title: string;
  protected _baseUrl: URL | null = null;
  protected _timeSuiteInitialized: number = Date.now();
  protected _timeSuiteExecuted: number | null = null;
  protected _timeSuiteFinished: number | null = null;
  protected _waitToExecute: boolean = false;
  protected _verifySslCert: boolean = true;
  protected _concurrencyLimit: number = 0;

  constructor(title: string) {
    this._title = title;
    if (FlagpoleExecution.opts.baseDomain) {
      this._baseUrl = new URL(FlagpoleExecution.opts.baseDomain);
    }
    this._beforeAllPromise = new Promise((resolve) => {
      this._beforeAllResolver = resolve;
    });
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolver = resolve;
    });
    // Spinner to wait for all
    // const interval = setInterval(() => {}, 300);
    // this.finally(() => {
    //   clearInterval(interval);
    // });
  }

  /**
   * PubSub Subscription
   *
   * @param callback
   */
  public subscribe(callback: SuiteStatusCallback): iSuite {
    this._subscribers.push(callback);
    return this;
  }

  /**
   * Turn on or off SSL verification for any new scenarios added to suite
   */
  public verifyCert = this.verifySslCert;
  public verifySslCert(verify: boolean): Suite {
    this._verifySslCert = verify;
    return this;
  }

  /**
   * By default tell scenarios in this suite not to run until specifically told to by execute()
   *
   * @param {boolean} bool
   * @returns {Suite}
   */
  public wait(bool: boolean = true): Suite {
    this._waitToExecute = bool;
    return this;
  }

  /**
   * How many scenarios should be able to execute concurrently?
   *
   * @param maxExecutions
   */
  public setConcurrencyLimit(maxExecutions: number) {
    this._concurrencyLimit = maxExecutions > 0 ? Math.floor(maxExecutions) : 0;
  }

  /**
   * Print all logs to console
   *
   * @returns {Suite}
   */
  public print(exitAfterPrint: boolean = true): void {
    const report: FlagpoleReport = new FlagpoleReport(
      this,
      FlagpoleExecution.opts
    );
    report.print().then(() => {
      exitAfterPrint && exitProcess(this.hasPassed);
    });
  }

  /**
   * Create a new scenario for this suite
   *
   * @param {string} title
   * @param {[string]} tags
   * @returns {Scenario}
   * @constructor
   */
  public scenario(
    title: string,
    type: ResponseType,
    opts?: BrowserOptions
  ): iScenario {
    const scenario: iScenario = Scenario.create(
      this,
      title,
      type,
      opts,
      (scenario: iScenario) => {
        return this._onAfterScenarioFinished(scenario);
      }
    );
    // Notify suite on any changes to scenario
    scenario.before((scenario: iScenario) => {
      return this._onBeforeScenarioExecutes(scenario);
    });
    scenario.after((scenario: iScenario) => {
      return this._onAfterScenarioExecutes(scenario);
    });
    scenario.error((errorMessage: string) => {
      return this._fireError(errorMessage);
    });
    // Some local tests fail with SSL verify on, so may have been disabled on this suite
    scenario.verifyCert(this._verifySslCert);
    // Should we hold off on executing?
    this._waitToExecute && scenario.wait();
    // Add this to our collection of scenarios
    this.scenarios.push(scenario);
    return scenario;
  }

  /**
   * Create a new JSON/REST API Scenario
   */
  public json(title: string): iScenario {
    return this.scenario(title, ResponseType.json);
  }

  /**
   * Create a new Image Scenario
   */
  public image(title: string): iScenario {
    return this.scenario(title, ResponseType.image);
  }

  /**
   * Create a new Video Scenario
   */
  public video(title: string): iScenario {
    return this.scenario(title, ResponseType.video);
  }

  /**
   * Create a new HTML/DOM Scenario
   */
  public html(title: string): iScenario {
    return this.scenario(title, ResponseType.html);
  }

  /**
   * Create a new CSS Scenario
   */
  public stylesheet(title: string): iScenario {
    return this.scenario(title, ResponseType.stylesheet);
  }

  /**
   * Create a new Script Scenario
   */
  public script(title: string): iScenario {
    return this.scenario(title, ResponseType.script);
  }

  /**
   * Create a generic resource scenario
   */
  public resource(title: string): iScenario {
    return this.scenario(title, ResponseType.resource);
  }

  /**
   * Create a Browser/Puppeteer Scenario
   */
  public browser(title: string, opts: BrowserOptions = {}): iScenario {
    return this.scenario(title, ResponseType.browser, opts);
  }

  /**
   * Create an ExtJS Scenario
   */
  public extjs(title: string, opts: BrowserOptions = {}): iScenario {
    return this.scenario(title, ResponseType.extjs, opts);
  }

  /**
   * Set the base url, which is typically the domain. All scenarios will run relative to it.
   * Argument can also be an object where the key is the environment and the value is the base url.
   *
   * @param {string | {}} url
   * @returns {Suite}
   */
  public base(url: string): Suite;
  public base(basePathsByEnvironment: {}): Suite;
  public base(callback: SuiteBaseCallback): Suite;
  public base(url: string | {} | Function): Suite {
    let baseUrl: string = "";
    if (typeof url == "string") {
      baseUrl = url;
    } else if (typeof url == "function") {
      baseUrl = url.call(this, [this]);
    } else if (Object.keys(url).length > 0) {
      baseUrl = url[FlagpoleExecution.opts.environment];
      // If env didn't match one, just pick the first one
      if (!baseUrl) {
        baseUrl = url[Object.keys(url)[0]];
      }
    }
    if (baseUrl.length > 0) {
      this._baseUrl = new URL(baseUrl);
    } else {
      throw Error("Invalid base url.");
    }
    return this;
  }

  /**
   * If suite was told to wait, this will tell each scenario in it to run
   *
   * @returns {Suite}
   */
  public execute(): Suite {
    if (this.hasExecuted) {
      throw new Error(`Suite already executed.`);
    }
    this._timeSuiteExecuted = Date.now();
    this.scenarios.forEach(function (scenario) {
      scenario.execute();
    });
    return this;
  }

  /**
   * This callback will run right before the first scenario starts to execute
   *
   * @param callback
   */
  public beforeAll(callback: SuiteCallback): Suite {
    if (this.hasExecuted) {
      throw new Error(
        "Can not add beforeAll callbacks after execution has started."
      );
    }
    this._beforeAllCallbacks.push(callback);
    return this;
  }

  /**
   * Set callback that will run before each Scenario starts executing
   *
   * @param callback
   */
  public beforeEach(callback: ScenarioCallback): Suite {
    if (this.hasExecuted) {
      throw new Error(
        "Can not add beforeEach callbacks after execution has started."
      );
    }
    this._beforeEachCallbacks.push(callback);
    return this;
  }

  /**
   * Set callback that will run after each Scenario completes execution
   *
   * @param callback
   */
  public afterEach(callback: ScenarioCallback): Suite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add afterEach callbacks after execution has finished."
      );
    }
    this._afterEachCallbacks.push(callback);
    return this;
  }

  /**
   * Set callback to run after all scenarios complete
   *
   * @param callback
   */
  public afterAll(callback: SuiteCallback): Suite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add afterAll callbacks after execution has finished."
      );
    }
    this._afterAllCallbacks.push(callback);
    return this;
  }

  /**
   * This callback runs once the suite is done, if it errored
   *
   * @param callback
   */
  public error = this.catch;
  public catch(callback: SuiteErrorCallback): iSuite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add catch callbacks after execution has finished."
      );
    }
    this._errorCallbacks.push(callback);
    return this;
  }

  /**
   * This callback runs once the suite is done, if it passed
   *
   * @param callback
   */
  public success(callback: SuiteCallback): Suite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add success callbacks after execution has finished."
      );
    }
    this._successCallbacks.push(callback);
    return this;
  }

  /**
   * This callback runs once the suite is done, if it failed
   */
  public failure(callback: SuiteCallback): Suite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add failure callbacks after execution has finished."
      );
    }
    this._failureCallbacks.push(callback);
    return this;
  }

  /**
   * This callback will run once everything else is completed, whether pass or fail
   */
  public finally(callback: SuiteCallback): Suite {
    if (this.hasFinished) {
      throw new Error(
        "Can not add finally callbacks after execution has finished."
      );
    }
    this._finallyCallbacks.push(callback);
    return this;
  }

  public promise(): Promise<iSuite> {
    return new Promise((resolve, reject) => {
      this.success(resolve);
      this.error(reject);
      this.failure(reject);
    });
  }

  /**
   * Have all of the scenarios in this suite completed?
   */
  private _haveAllScenariosFinished(): boolean {
    return this.scenarios.every((scenario) => {
      return scenario.hasFinished;
    });
  }

  private _fireBeforeAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.mapSeries(this._beforeAllCallbacks, (_then) => {
        return _then(this);
      })
        .then(() => {
          this._publish(SuiteStatusEvent.beforeAllExecute);
          this._beforeAllResolver();
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireBeforeEach(scenario: iScenario): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      // Do all all fthe finally callbacks first
      Promise.mapSeries(this._beforeEachCallbacks, (_then) => {
        return _then.apply(suite, [scenario]);
      })
        .then(() => {
          this._publish(SuiteStatusEvent.beforeEachExecute);
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireAfterEach(scenario: iScenario): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      // Do all of the finally callbacks first
      Promise.mapSeries(this._afterEachCallbacks, (_then) => {
        return _then.apply(suite, [scenario]);
      })
        .then(() => {
          this._publish(SuiteStatusEvent.afterEachExecute);
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireAfterAll(): Promise<void> {
    const suite: Suite = this;
    this._timeSuiteFinished = Date.now();
    return new Promise((resolve, reject) => {
      // Do all all fthe finally callbacks first
      Promise.mapSeries(this._afterAllCallbacks, (_then) => {
        return _then.apply(suite, [suite]);
      })
        .then(() => {
          this._publish(SuiteStatusEvent.afterAllExecute);
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireSuccess(): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      // Do all all fthe finally callbacks first
      Promise.mapSeries(this._successCallbacks, (_then) => {
        return _then.apply(suite, [suite]);
      })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireFailure(): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      // Do all all fthe finally callbacks first
      Promise.mapSeries(this._failureCallbacks, (_then) => {
        return _then.apply(suite, [suite]);
      })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireError(errorMessage: string): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      // Do all all fthe finally callbacks first
      Promise.mapSeries(this._errorCallbacks, (_then) => {
        return _then.apply(suite, [errorMessage, suite]);
      })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private _fireFinally(): Promise<void> {
    const suite: Suite = this;
    return new Promise((resolve, reject) => {
      Promise.mapSeries(this._finallyCallbacks, (_then) => {
        return _then.apply(suite, [suite]);
      })
        .then(() => {
          this._publish(SuiteStatusEvent.finished);
          this._finishedResolver();
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private async _onBeforeScenarioExecutes(
    scenario: iScenario
  ): Promise<iScenario> {
    // This scenario is executing, suite was not previously executing
    if (scenario.hasExecuted && !this.hasExecuted) {
      await this._fireBeforeAll();
    }
    await this._beforeAllResolved();
    await this._fireBeforeEach(scenario);
    return scenario;
  }

  private async _onAfterScenarioExecutes(
    scenario: iScenario
  ): Promise<iScenario> {
    await this._fireAfterEach(scenario);
    return scenario;
  }

  private async _onAfterScenarioFinished(scenario: iScenario): Promise<void> {
    // Is every scenario completed? And only run it once
    if (this._haveAllScenariosFinished() && !this.hasFinished) {
      await this._fireAfterAll();
      // Success or failure?
      this.hasPassed ? await this._fireSuccess() : await this._fireFailure();
      // All Done
      await this._fireFinally();
      // Should we print automatically?
      if (FlagpoleExecution.opts.automaticallyPrintToConsole) {
        this.print(FlagpoleExecution.opts.exitOnDone);
      } else {
        FlagpoleExecution.opts.exitOnDone && exitProcess(this.hasPassed);
      }
    }
  }

  protected async _beforeAllResolved(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._beforeAllPromise
        .then(() => {
          resolve(true);
        })
        .catch((ex) => {
          reject(ex);
        });
    });
  }

  protected _publish(statusEvent: SuiteStatusEvent) {
    this._subscribers.forEach((callback: SuiteStatusCallback) => {
      callback(this, statusEvent);
    });
  }

  protected _executeNext(): void {
    this.scenarios.some((scenario) => {
      if (!scenario.hasExecuted && scenario.canExecute) {
        scenario.execute();
        return true;
      }
    });
  }
}
