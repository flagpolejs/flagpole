import { URL } from "url";
import { FlagpoleReport } from "./logging/flagpole-report";
import {
  iSuite,
  iScenario,
  SuiteStatusCallback,
  SuiteCallback,
  ScenarioCallback,
  KeyValue,
  ScenarioMapper,
  ScenarioInitOptions,
  ClassConstructor,
} from "./interfaces";
import { exitProcess, toType } from "./util";
import { FlagpoleExecution } from "./flagpole-execution";
import { SuiteTaskManager } from "./suite-task-manager";
import { ScenarioType } from "./scenario-types";
import { createScenario } from "./scenario-type-map";

type BaseDomainCallback = (suite: iSuite) => string;

/**
 * A suite contains many scenarios
 */
export class Suite implements iSuite {
  public get baseUrl(): URL | null {
    return this._baseUrl;
  }

  public get failCount(): number {
    return this._taskManager.scenariosFailed.length;
  }

  public get waitingToExecuteCount(): number {
    return this._taskManager.scenariosWaitingToExecute.length;
  }

  public get executingCount(): number {
    return this._taskManager.scenariosCurrentlyExcuting.length;
  }

  /**
   * Did every scenario in this suite pass?
   */
  public get hasPassed(): boolean {
    return this._taskManager.haveAllPassed;
  }

  /**
   * Did any scenario in this suite fail?
   */
  public get hasFailed(): boolean {
    return this._taskManager.haveAnyFailed;
  }

  /**
   * Did this suite start running yet?
   */
  public get hasExecuted(): boolean {
    return this._taskManager.hasExecutionBegan;
  }

  /**
   * Has this suite finished running?
   */
  public get hasFinished(): boolean {
    return this._taskManager.hasFinished;
  }

  /**
   * Total duration in milliseconds from initialization to completion
   */
  public get totalDuration(): number | null {
    return this.totalDuration;
  }

  /**
   * Duration in milliseconds between execution start and completion
   */
  public get executionDuration(): number | null {
    return this._taskManager.executionDuration;
  }

  public get title(): string {
    return this._title;
  }

  public get finished(): Promise<void> {
    return this._taskManager.finished;
  }

  public get executionOptions(): FlagpoleExecution {
    return FlagpoleExecution.global;
  }

  public get scenarios(): iScenario[] {
    return this._taskManager.scenarios;
  }

  protected _title: string;
  protected _baseUrl: URL | null = null;
  protected _waitToExecute: boolean = false;
  protected _verifySslCert: boolean = true;
  protected _taskManager: SuiteTaskManager;
  protected _aliasedData: any = {};

  constructor(title: string) {
    this._title = title;
    if (FlagpoleExecution.global.baseDomain) {
      this._baseUrl = new URL(FlagpoleExecution.global.baseDomain);
    }
    this._taskManager = new SuiteTaskManager(this);
    this._taskManager.finally(() => {
      // Should we print automatically?
      if (FlagpoleExecution.global.automaticallyPrintToConsole) {
        this.print(FlagpoleExecution.global.exitOnDone);
      } else {
        FlagpoleExecution.global.exitOnDone && exitProcess(this.hasPassed);
      }
    });
  }

  /**
   * PubSub Subscription
   *
   * @param callback
   */
  public subscribe(callback: SuiteStatusCallback): iSuite {
    this._taskManager.subscribe(callback);
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
   * @deprecated
   * @param maxExecutions
   */
  public setConcurrencyLimit(maxExecutions: number): iSuite {
    this._taskManager.concurrencyLimit = maxExecutions;
    return this;
  }

  public get concurrencyLimit(): number {
    return this._taskManager.concurrencyLimit;
  }

  public set concurrencyLimit(maxExecutions: number) {
    this._taskManager.concurrencyLimit = maxExecutions;
  }

  /**
   * If a scenario hasn't completed in this period of time, cut it off
   *
   * @param timeout
   * @deprecated
   * @returns
   */
  public setMaxScenarioDuration(timeout: number): iSuite {
    this._taskManager.maxScenarioDuration = timeout;
    return this;
  }

  public get maxScenarioDuration(): number {
    return this._taskManager.maxScenarioDuration;
  }

  public set maxScenarioDuration(timeoutMs: number) {
    this._taskManager.maxScenarioDuration = timeoutMs;
  }

  /**
   * If a suite hasn't completed in this period of time, cut the scenarios off
   *
   * @param timeout
   * @returns
   */
  public setMaxSuiteDuration(timeout: number): iSuite {
    this._taskManager.maxSuiteDuration = timeout;
    return this;
  }

  public get maxSuiteDuration(): number {
    return this._taskManager.maxSuiteDuration;
  }

  public set maxSuiteDuration(timeoutMs: number) {
    this._taskManager.maxSuiteDuration = timeoutMs;
  }

  /**
   * Print all logs to console
   *
   * @returns {Suite}
   */
  public print(exitAfterPrint: boolean = true): void {
    const report: FlagpoleReport = new FlagpoleReport(this);
    report.print().then(() => {
      exitAfterPrint && exitProcess(this.hasPassed);
    });
  }

  public scenario<T extends iScenario>(
    title: string,
    type: ScenarioType | ClassConstructor<T>,
    opts: KeyValue = {}
  ): T {
    const scenario: iScenario = createScenario<T>(this, title, type, opts);
    // Some local tests fail with SSL verify on, so may have been disabled on this suite
    scenario.verifyCert(this._verifySslCert);
    // Should we hold off on executing?
    this._waitToExecute && scenario.wait();
    // Add this to our collection of scenarios
    this._taskManager.registerScenario(scenario);
    return scenario as T;
  }

  /**
   * Effectively clones another scenario
   *
   * @param originalScenario
   * @returns
   */
  public import(originalScenario: iScenario) {
    const scenario: iScenario = this.scenario(
      originalScenario.title,
      originalScenario.type,
      originalScenario.opts
    ).open(originalScenario.buildUrl().href);
    originalScenario.nextCallbacks.forEach((next) => {
      scenario.next(next.message, next.callback);
    });
    return scenario;
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
  public base(callback: SuiteCallback): Suite;
  public base(url: string | KeyValue | BaseDomainCallback): Suite {
    let baseUrl: string = "";
    if (typeof url == "string") {
      baseUrl = url;
    } else if (typeof url == "function") {
      baseUrl = url(this);
    } else if (Object.keys(url).length > 0) {
      const env = FlagpoleExecution.global.environment?.name || "";
      baseUrl = url[env];
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
   * If suite was told to wait, this will tell each scenario in it to stop waiting
   *
   * @returns {Suite}
   */
  public execute(): Suite {
    if (this.hasExecuted) {
      throw new Error(`Suite already executed.`);
    }
    this.scenarios.forEach((scenario) => {
      scenario.wait(false);
    });
    return this;
  }

  /**
   * This callback will run right before the first scenario starts to execute
   *
   * @param callback
   */
  public beforeAll(callback: SuiteCallback, prepend: boolean = false): Suite {
    this._taskManager.beforeAll(callback, prepend);
    return this;
  }

  /**
   * Set callback that will run before each Scenario starts executing
   *
   * @param callback
   */
  public beforeEach(
    callback: ScenarioCallback,
    prepend: boolean = false
  ): Suite {
    this._taskManager.beforeEach(callback, prepend);
    return this;
  }

  /**
   * Set callback that will run after each Scenario completes execution
   *
   * @param callback
   */
  public afterEach(
    callback: ScenarioCallback,
    prepend: boolean = false
  ): Suite {
    this._taskManager.afterEach(callback, prepend);
    return this;
  }

  /**
   * Set callback to run after all scenarios complete
   *
   * @param callback
   */
  public afterAll(callback: SuiteCallback, prepend: boolean = false): Suite {
    this._taskManager.afterAll(callback, prepend);
    return this;
  }

  /**
   * This callback runs once the suite is done, if it passed
   *
   * @param callback
   */
  public success(callback: SuiteCallback, prepend: boolean = false): Suite {
    this._taskManager.success(callback, prepend);
    return this;
  }

  /**
   * This callback runs once the suite is done, if it failed
   */
  public failure(callback: SuiteCallback, prepend: boolean = false): Suite {
    this._taskManager.failure(callback, prepend);
    return this;
  }

  /**
   * This callback will run once everything else is completed, whether pass or fail
   * prepend these callbacks so that the taskManager.finally runs last
   */
  public finally(callback: SuiteCallback, prepend: boolean = true): Suite {
    this._taskManager.finally(callback, prepend);
    return this;
  }

  /**
   * Promisify the suite: resolves on pass, rejects on failure
   */
  public promise(): Promise<iSuite> {
    return new Promise((resolve, reject) => {
      this.success(resolve);
      this.failure(reject);
    });
  }

  protected _getArray(key: string): any[] {
    const type = toType(this._aliasedData[key]);
    if (type == "undefined") {
      this._aliasedData[key] = [];
    } else if (type !== "array") {
      throw Error(
        `${key} was of type ${type} and not an array. Can only push into an array.`
      );
    }
    return this._aliasedData[key];
  }

  public mapScenarios(key: string, map: ScenarioMapper): Promise<iScenario[]>;
  public mapScenarios(arr: any[], map: ScenarioMapper): Promise<iScenario[]>;
  public mapScenarios(
    a: string | any[],
    map: ScenarioMapper
  ): Promise<iScenario[]> {
    const arr = typeof a === "string" ? this._getArray(a) : a;
    return Promise.all(
      arr.map((item, i, arr) => map(item, i, arr, this).waitForFinished())
    );
  }

  /**
   * Similar to set, except that it pushes this value into an array named key, creating the array if it doesn't yet exist
   *
   * @param key
   * @param value
   * @returns
   */
  public push(key: string, value: any): iSuite {
    this._getArray(key).push(value);
    return this;
  }

  /**
   * Saves a value into cache in the suite context
   *
   * @param key
   * @param value
   * @returns
   */
  public set<T = any>(key: string, value: T): iSuite {
    this._aliasedData[key] = value;
    return this;
  }

  /**
   * Retrieves a value saved to cache in the suite context
   *
   * @param key
   * @returns
   */
  public get<T = any>(key: string): T {
    return this._aliasedData[key];
  }

  public template(templateOptions: ScenarioInitOptions) {
    return (title: string, scenarioOptions: ScenarioInitOptions): iScenario => {
      const opts: ScenarioInitOptions = {
        ...templateOptions,
        ...scenarioOptions,
      };
      const scenario = this.scenario(title, opts.type || "json", opts.opts);
      if (opts.digestAuth) scenario.setDigestAuth(opts.digestAuth);
      if (opts.basicAuth) scenario.setBasicAuth(opts.basicAuth);
      if (opts.bearerToken) scenario.setBearerToken(opts.bearerToken);
      if (opts.method) scenario.setMethod(opts.method);
      if (opts.url) scenario.open(opts.url, opts.httpRequestOpts);
      if (opts.jsonBody) scenario.setJsonBody(opts.jsonBody);
      if (opts.rawBody) scenario.setRawBody(opts.rawBody);
      if (opts.formData) scenario.setFormData(opts.formData);
      if (opts.headers) scenario.setHeaders(opts.headers);
      if (opts.cookies) scenario.setCookies(opts.cookies);
      if (opts.timeout) scenario.setTimeout(opts.timeout);
      if (opts.maxRedirects) scenario.setMaxRedirects(opts.maxRedirects);
      if (opts.proxy) scenario.setProxy(opts.proxy);
      if (opts.statusCode) {
        scenario.next((context) => {
          context.assert(context.response.statusCode).equals(opts.statusCode);
        });
      }
      if (opts.maxLoadTime) {
        scenario.next((context) => {
          context
            .assert(context.response.loadTime)
            .lessThanOrEquals(opts.maxLoadTime);
        });
      }
      if (opts.set) {
        Object.keys(opts.set).forEach((key) => {
          if (opts.set) scenario.set(key, opts.set[key]);
        });
      }
      if (opts.next) {
        if (typeof opts.next == "function") {
          scenario.next(opts.next);
        } else if (Array.isArray(opts.next)) {
          opts.next.forEach((callback) => {
            scenario.next(callback);
          });
        } else {
          Object.keys(opts.next).forEach((title) => {
            if (opts.next && typeof opts.next[title] == "function") {
              scenario.next(title, opts.next[title]);
            }
          });
        }
      }
      return scenario;
    };
  }
}
