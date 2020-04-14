import { SuiteConfig } from "./config";
import {
  FlagpoleExecutionOptions,
  FlagpoleOutput,
  FlagpoleExecution,
} from "../flagpoleexecutionoptions";
import { Suite } from "../suite";
import { FlagpoleReport } from "../logging/flagpolereport";
import { asyncForEach } from "../util";
import { Flagpole } from "../flagpole";
import { spawn, fork, ForkOptions, exec } from "child_process";

export enum SuiteExecutionExitCode {
  success = 0,
  failure = 1,
}

/**
 * Immutable result of an execution
 */
export class SuiteExecutionResult {
  public get output(): string[] {
    return this._output;
  }

  public get exitCode(): number {
    return this._exitCode;
  }

  protected _output: string[];
  protected _exitCode: number;

  constructor(output: string[], exitCode: number) {
    this._output = output;
    this._exitCode = exitCode;
  }

  public toString(): string {
    return this._output.join("\n");
  }
}

export class SuiteExecution {
  protected _result: SuiteExecutionResult | null = null;
  protected _started: number | null = null;
  protected _finished: number | null = null;
  protected _subscribers: Function[] = [];
  protected _finally: Function[] = [];
  protected _output: string[] = [];
  protected _finishedPromise: Promise<SuiteExecutionResult>;
  protected _finishedResolver: Function = () => {};

  public get result(): Promise<SuiteExecutionResult> {
    return this._finishedPromise;
  }

  public get exitCode(): number | null {
    return this._result === null ? null : this._result.exitCode;
  }

  public get output(): string[] {
    return this._output;
  }

  public static executePath(
    filePath: string,
    opts: FlagpoleExecutionOptions
  ): SuiteExecution {
    const execution: SuiteExecution = new SuiteExecution();
    execution.executePath(filePath, opts);
    return execution;
  }

  public static executeSuite(config: SuiteConfig): SuiteExecution {
    const execution: SuiteExecution = new SuiteExecution();
    execution.executeSuite(config);
    return execution;
  }

  constructor() {
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolver = resolve;
    });
  }

  public subscribe(
    callback: (output: string, execution: SuiteExecution) => void
  ) {
    this._subscribers.push(callback);
  }

  public finally(callback: (execution: SuiteExecution) => void) {
    this._finally.push(callback);
  }

  public toString(): string {
    return this._output.join("\n");
  }

  public async executePath(
    filePath: string,
    opts: FlagpoleExecutionOptions
  ): Promise<SuiteExecutionResult> {
    if (this._result !== null || this._started !== null) {
      throw new Error(`This execution has already run.`);
    }
    this._started = Date.now();
    this._result = await this._execute(filePath, opts);
    this._finished = Date.now();
    this._finally.forEach((callback: Function) => {
      callback.apply(this, [this]);
    });
    this._finishedResolver(this._result);
    return this._result;
  }

  /**
   * Start running this suite
   *
   * @param {string} filePath
   */
  public async executeSuite(
    config: SuiteConfig
  ): Promise<SuiteExecutionResult> {
    return this.executePath(config.getTestPath(), FlagpoleExecution.opts);
  }

  protected _execute(
    filePath: string,
    opts: FlagpoleExecutionOptions
  ): Promise<SuiteExecutionResult> {
    return new Promise(async (resolve) => {
      opts.exitOnDone = true;
      opts.isChildProcess = true;
      //this._executeWithFork(filePath, opts, resolve);
      this._executeWithSpawn(filePath, opts, resolve);
      //this._executeWithExec(filePath, opts, resolve);
    });
  }

  private _executeWithExec(
    filePath: string,
    opts: FlagpoleExecutionOptions,
    resolve: Function
  ) {
    const command: string = `node ${filePath} ${opts.toString()}`;
    exec(command, (err, stdout, stderr) => {
      const exitCode = err && err.code ? err.code : 0;
      if (err) {
        this._logLine("FAILED TEST SUITE:");
        this._logLine(filePath + " exited with error code " + exitCode);
        this._logLine("\n");
        if (stderr) {
          this._logLine(stderr);
        }
      } else {
        this._logLine(stdout);
      }
      resolve(new SuiteExecutionResult(this._output, exitCode));
    });
  }

  private _executeWithSpawn(
    filePath: string,
    opts: FlagpoleExecutionOptions,
    resolve: Function
  ) {
    const command: string[] = [filePath].concat(opts.toArgs());
    const proc = spawn("node", command);
    proc.stdout.on("data", (data) => {
      this._logLine(data);
    });
    proc.stderr.on("data", (data) => {
      this._logLine(data);
    });
    proc.on("error", (err) => {
      this._logLine(err.message);
    });
    proc.on("close", (exitCode) => {
      if (exitCode > 0 && opts.output == FlagpoleOutput.console) {
        this._logLine("FAILED TEST SUITE:");
        this._logLine(filePath + " exited with error code " + exitCode);
        this._logLine("\n");
      }
      resolve(new SuiteExecutionResult(this._output, exitCode));
    });
  }

  private _executeWithFork(
    filePath: string,
    opts: FlagpoleExecutionOptions,
    resolve: Function
  ) {
    const options: ForkOptions = {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    };
    const proc = fork(filePath, opts.toArgs(), options);
    proc.on("exit", (exitCode) => {
      if (
        (exitCode == null || exitCode !== 0) &&
        opts.output == FlagpoleOutput.console
      ) {
        this._logLine("FAILED TEST SUITE:");
        this._logLine(filePath + " exited with error code " + exitCode);
        this._logLine("\n");
      }
      resolve(
        new SuiteExecutionResult(
          this._output,
          exitCode === null ? -1 : exitCode
        )
      );
    });
    proc.on("message", (msg) => {
      console.log("child message received!");
      this._logLine(msg);
    });
  }

  protected _logLine(data: string | Buffer) {
    if (data) {
      const lines = String(data).trim().split("\n");
      lines.forEach((line) => {
        this._output.push(line);
        this._subscribers.forEach((callback: Function) => {
          callback.apply(this, [line, this]);
        });
      });
    }
  }
}

export class SuiteExecutionInline extends SuiteExecution {
  public static executePath(
    filePath: string,
    opts: FlagpoleExecutionOptions
  ): SuiteExecutionInline {
    const execution: SuiteExecutionInline = new SuiteExecutionInline();
    execution.executePath(filePath, opts);
    return execution;
  }

  public static executeSuite(config: SuiteConfig): SuiteExecutionInline {
    const execution: SuiteExecutionInline = new SuiteExecutionInline();
    execution.executeSuite(config);
    return execution;
  }

  protected async _execute(
    filePath: string,
    opts: FlagpoleExecutionOptions
  ): Promise<SuiteExecutionResult> {
    // Start with success
    let exitCode: number = SuiteExecutionExitCode.success;
    // Override the automatically print value
    opts = Object.assign({}, opts);
    opts.automaticallyPrintToConsole = false;
    // Save current global output options
    const globalOpts = Object.assign({}, FlagpoleExecution.opts);
    // Set it to our temporary opts
    FlagpoleExecution.opts = opts;
    // How many suites do we have now?
    const preSuiteCount: number = Flagpole.suites.length;
    // Embed the suite file... it should add at least one suite
    await require(`${filePath}`);
    // How many suites do we have now?
    const postSuiteCount: number = Flagpole.suites.length;
    // If the require added at least one
    if (postSuiteCount > preSuiteCount) {
      // Get the added suites
      const createdSuites = Flagpole.suites.slice(preSuiteCount);
      // Loop through each added suite and grab the "finished" promise, which will be resolved once it is done
      let promises: Promise<void>[] = [];
      createdSuites.forEach((suite: Suite) => {
        promises.push(suite.finished);
      });
      // Wait for every suite to finish executing
      await Promise.all(promises);
      // Loop through the added suites again and capture output
      await asyncForEach(createdSuites, async (suite: Suite) => {
        if (suite.hasFailed) {
          exitCode = SuiteExecutionExitCode.failure;
        }
        const report: FlagpoleReport = new FlagpoleReport(suite, opts);
        this._logLine(await report.toString());
      });
    }
    FlagpoleExecution.opts = globalOpts;
    return new SuiteExecutionResult(this._output, exitCode);
  }
}
