import { SuiteConfig } from "./config";
import { spawn, fork, ForkOptions, exec } from "child_process";
import { existsSync } from "fs";
import { FlagpoleExecution } from "../flagpoleexecution";
import { FlagpoleOptions } from "../flagpoleoptions";

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

  public static executePath(filePath: string): SuiteExecution {
    const execution: SuiteExecution = new SuiteExecution();
    execution.executePath(filePath);
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

  public async executePath(filePath: string): Promise<SuiteExecutionResult> {
    if (this._result !== null || this._started !== null) {
      throw new Error(`This execution has already run.`);
    }
    // Start execution
    this._started = Date.now();
    if (existsSync(filePath)) {
      this._result = await this._execute(filePath);
    } else {
      this._result = new SuiteExecutionResult(
        ["Suite was not found in the output folder. Did you forget to build?"],
        1
      );
    }
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
  public async executeSuite(suite: SuiteConfig): Promise<SuiteExecutionResult> {
    return this.executePath(suite.getTestPath());
  }

  protected _execute(filePath: string): Promise<SuiteExecutionResult> {
    return new Promise(async (resolve) => {
      const opts = FlagpoleExecution.opts.clone({
        exitOnDone: true,
        isChildProcess: true,
        automaticallyPrintToConsole: true,
      });
      //this._executeWithFork(filePath, opts, resolve);
      this._executeWithSpawn(filePath, opts, resolve);
      //this._executeWithExec(filePath, opts, resolve);
    });
  }

  private _executeWithExec(
    filePath: string,
    opts: FlagpoleOptions,
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
    opts: FlagpoleOptions,
    resolve: Function
  ) {
    const command: string[] = [filePath].concat(opts.toArgs());
    console.log(command);
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
      if (exitCode > 0 && opts.shouldOutputToConsole) {
        this._logLine("FAILED TEST SUITE:");
        this._logLine(filePath + " exited with error code " + exitCode);
        this._logLine("\n");
      }
      resolve(new SuiteExecutionResult(this._output, exitCode));
    });
  }

  private _executeWithFork(
    filePath: string,
    opts: FlagpoleOptions,
    resolve: Function
  ) {
    const options: ForkOptions = {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    };
    const proc = fork(filePath, opts.toArgs(), options);
    proc.on("exit", (exitCode) => {
      if ((exitCode == null || exitCode !== 0) && opts.shouldOutputToConsole) {
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
