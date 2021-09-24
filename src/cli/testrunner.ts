import { SuiteConfig } from "../flagpoleconfig";
import { Cli } from "./cli";
import { SuiteExecution, SuiteExecutionResult } from "./suiteexecution";
import { FlagpoleExecution } from "..";
import { SuiteExecutionInline } from "./suiteexecutioninline";

export class TestRunner {
  private _suiteConfigs: { [s: string]: SuiteConfig } = {};
  private _executionResults: SuiteExecutionResult[] = [];
  private _timeStart: number = Date.now();
  private _subscribers: Function[] = [];
  private _finishedPromise: Promise<SuiteExecutionResult[]>;
  private _finishedResolver: (
    results: SuiteExecutionResult[]
  ) => void = () => {};

  public get suites(): SuiteConfig[] {
    let arr: SuiteConfig[] = [];
    Object.keys(this._suiteConfigs).forEach((suiteName) => {
      arr.push(this._suiteConfigs[suiteName]);
    });
    return arr;
  }

  public get results(): SuiteExecutionResult[] {
    return this._executionResults;
  }

  public get exitCode(): number {
    let exitCode: number = 0;
    this._executionResults.forEach((result) => {
      exitCode = result.exitCode > exitCode ? result.exitCode : exitCode;
    });
    return exitCode;
  }

  public get allPassing(): boolean {
    return this._executionResults.every((result) => {
      return result.exitCode == 0;
    });
  }

  public constructor() {
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolver = resolve;
    });
  }

  public after(callback: (results: SuiteExecutionResult[]) => void) {
    this._finishedPromise.then(callback);
  }

  public subscribe(callback: Function) {
    this._subscribers.push(callback);
  }

  /**
   * Add a suite to the list of ones we are running
   * @param suite
   */
  public addSuite(suiteConfig: SuiteConfig) {
    this._suiteConfigs[suiteConfig.name] = suiteConfig;
  }

  /**
   * Start running suites
   */
  public async run(): Promise<SuiteExecutionResult[]> {
    this._executionResults = [];
    // Loop through each suite and run it
    const totalSuites = Object.keys(this._suiteConfigs).length;
    let count: number = 1;
    for (let suiteName in this._suiteConfigs) {
      this._publish(
        `Running suite ${suiteName} (${count} of ${totalSuites})...`
      );
      let execution: SuiteExecution = SuiteExecutionInline.executeSuite(
        this._suiteConfigs[suiteName]
      );
      this._executionResults.push(await execution.result);
      count++;
    }
    this._onDone();
    return this._executionResults;
  }

  public async runSpawn(
    asyncExecution: boolean
  ): Promise<SuiteExecutionResult[]> {
    return asyncExecution ? this._runSpawnAync() : this._runSpawn();
  }

  protected async _runSpawn(): Promise<SuiteExecutionResult[]> {
    this._executionResults = [];
    // Loop through each suite and run it
    const totalSuites = Object.keys(this._suiteConfigs).length;
    let count: number = 1;
    for (let suiteName in this._suiteConfigs) {
      this._publish(
        `Running suite ${suiteName} (${count} of ${totalSuites})...`
      );
      let execution: SuiteExecution = SuiteExecution.executeSuite(
        this._suiteConfigs[suiteName]
      );
      this._executionResults.push(await execution.result);
      count++;
    }
    this._onDone();
    return this._executionResults;
  }

  protected async _runSpawnAync(): Promise<SuiteExecutionResult[]> {
    return new Promise((resolve, reject) => {
      // Loop through each suite and run it
      const totalSuites = Object.keys(this._suiteConfigs).length;
      const suitePromises: Promise<SuiteExecutionResult>[] = [];
      let count: number = 1;
      for (let suiteName in this._suiteConfigs) {
        this._publish(
          `Running suite ${suiteName} (${count} of ${totalSuites})...`
        );
        let execution: SuiteExecution = SuiteExecution.executeSuite(
          this._suiteConfigs[suiteName]
        );
        suitePromises.push(execution.result);
        count++;
      }
      Promise.all(suitePromises)
        .then((results) => {
          this._executionResults = results;
          this._onDone();
          resolve(this._executionResults);
        })
        .catch(reject);
    });
  }

  private _getSummary(): { duration: number, pass: number, fail: number } {

    const duration = Date.now() - this._timeStart;
    let pass = 0;
    let fail = 0;

    this._executionResults.forEach((result) => {
      if (result.exitCode == 0) {
        pass += 1;
      } else {
        fail += 1;
      }
    });

    return { duration, pass, fail }
  }

  private _onDone() {

    let output: string = "";
    this._finishedResolver(this._executionResults);
    if (FlagpoleExecution.global.isJsonOutput) {
      const suiteOutput: string[] = []
      this._executionResults.forEach((result) => {
        suiteOutput.push(result.toString());
      })
      const overall = this._getSummary();
      output =
        `
                { 
                    "summary": {
                        "passCount": ${overall.pass}, 
                        "failCount": ${overall.fail}, 
                        "duration": ${overall.duration} 
                    }, ` +
        `"suites": [
                        ${suiteOutput.join(",")}
                    ]
                }
            `;
    } else {
      this._executionResults.forEach((result) => {
        output += result.toString() + "\n";
      });
    }
    if (FlagpoleExecution.global.isBrowserOutput) {
      const open = require("open");
      const fs = require("fs");
      const tmp = require("tmp");
      const tmpObj = tmp.fileSync({ postfix: ".html" });
      const filePath: string = tmpObj.name;
      let template: string = fs.readFileSync(
        `${__dirname}/web/report.html`,
        "utf8"
      );
      template = template.replace("${output}", output).replace("${nav}", "");
      fs.writeFileSync(filePath, template);
      Cli.log(`Writing output to: ${filePath}`);
      (async () => {
        await open(filePath);
        Cli.exit(this.allPassing ? 0 : 1);
      })();
    } else if (FlagpoleExecution.global.isXmlOutput) {
      const path = require("path");
      const { ensureDirSync, readFileSync, writeFileSync } = require("fs-extra");

      const reportsFolder = FlagpoleExecution.global.config.getReportsFolder();

      ensureDirSync(reportsFolder);

      const reportFileName = `${this._timeStart}-report.xml`
      const filePath = path.join(reportsFolder, reportFileName)

      let template: string = readFileSync(
        `${__dirname}/web/report.xml`,
        "utf8"
      );

      template = template.replace("${output}", output);
      writeFileSync(filePath, template);

      if (this.allPassing) {
        Cli.log("All suites passed.");
      } else {
        Cli.log("Some suites failed.");
      }

      Cli.log(`Writing output to: ${filePath}.`);
      Cli.exit(this.allPassing ? 0 : 1);
    } else if (FlagpoleExecution.global.isCiOutput) {
      const overall = this._getSummary();
      Cli.log(`---SUMMARY---`)
      Cli.log(`Passed: ${overall.pass}`)
      Cli.log(`Failed: ${overall.fail}`)
      Cli.log(`Duration: ${overall.duration}ms`)
      Cli.log("\n")
      Cli.log(output);
    } else {
      Cli.log(output);
      if (!this.allPassing && FlagpoleExecution.global.shouldOutputToConsole) {
        Cli.log("Some suites failed.");
      }
    }
  }

  public toString(): string {
    let output: string = "";
    this._executionResults.forEach((result) => {
      output += result.toString() + "\n";
    });
    return output;
  }

  protected _publish(message: string) {
    this._subscribers.forEach((callback) => {
      callback.apply(this, [message]);
    });
  }
}
