import { ResponseType } from "./enums";
import { Scenario } from "./scenario";
import { URL } from "url";
import { FlagpoleReport } from "./logging/flagpolereport";
import {
  iSuite,
  iScenario,
  SuiteStatusCallback,
  SuiteCallback,
  ScenarioCallback,
  KeyValue,
  ScenarioMapper,
} from "./interfaces";
import { exitProcess, toType } from "./util";
import { BrowserOptions } from "./httprequest";
import { FlagpoleExecution } from "./flagpoleexecution";
import { SuiteTaskManager } from "./suitetaskmanager";
import { FfprobeOptions } from "media-probe";

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
   * @param maxExecutions
   */
  public setConcurrencyLimit(maxExecutions: number): iSuite {
    this._taskManager.concurrencyLimit = maxExecutions;
    return this;
  }

  public setMaxScenarioDuration(timeout: number): iSuite {
    this._taskManager.maxScenarioDuration = timeout;
    return this;
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
    type: "browser" | "extjs",
    opts?: BrowserOptions
  ): iScenario;
  public scenario(
    title: string,
    type: "ffprobe",
    opts?: FfprobeOptions
  ): iScenario;
  public scenario(title: string, type?: ResponseType): iScenario;
  public scenario(
    title: string,
    type: ResponseType = "html",
    opts?: any
  ): iScenario {
    const scenario: iScenario = Scenario.create(this, title, type, opts);
    // Some local tests fail with SSL verify on, so may have been disabled on this suite
    scenario.verifyCert(this._verifySslCert);
    // Should we hold off on executing?
    this._waitToExecute && scenario.wait();
    // Add this to our collection of scenarios
    this._taskManager.registerScenario(scenario);
    return scenario;
  }

  /**
   * Create a new JSON/REST API Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public json(title: string): iScenario {
    return this.scenario(title, "json");
  }

  /**
   * Create a new Image Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public image(title: string): iScenario {
    return this.scenario(title, "image");
  }

  /**
   * Create a new Video Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public video(title: string): iScenario {
    return this.scenario(title, "video");
  }

  /**
   * Create a new HTML/DOM Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public html(title: string): iScenario {
    return this.scenario(title, "html");
  }

  /**
   * Create a new CSS Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public stylesheet(title: string): iScenario {
    return this.scenario(title, "stylesheet");
  }

  /**
   * Create a new Script Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public script(title: string): iScenario {
    return this.scenario(title, "script");
  }

  /**
   * Create a generic resource scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public resource(title: string): iScenario {
    return this.scenario(title, "resource");
  }

  /**
   * Create a Browser/Puppeteer Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public browser(title: string, opts: BrowserOptions = {}): iScenario {
    return this.scenario(title, "browser", opts);
  }

  /**
   * Create an ExtJS Scenario
   *
   * @deprecated Deprecated in 2.4, you should use the `scenario` method instead
   */
  public extjs(title: string, opts: BrowserOptions = {}): iScenario {
    return this.scenario(title, "extjs", opts);
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
   */
  public finally(callback: SuiteCallback, prepend: boolean = false): Suite {
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

  public push(key: string, value: any): iSuite {
    this._getArray(key).push(value);
    return this;
  }

  public set(key: string, value: any): iSuite {
    this._aliasedData[key] = value;
    return this;
  }

  public get<T = any>(key: string): T {
    return this._aliasedData[key];
  }
}
