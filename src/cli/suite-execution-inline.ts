import { FlagpoleExecution } from "../flagpole-execution";
import {
  SuiteExecution,
  SuiteExecutionResult,
  SuiteExecutionExitCode,
} from "./suite-execution";
import { SuiteConfig } from "../flagpole-config";
import { FlagpoleReport } from "../logging/flagpole-report";
import { iSuite } from "../interfaces";
import { asyncForEach } from "../util";
import { Flagpole } from "../flagpole";

export class SuiteExecutionInline extends SuiteExecution {
  public static executePath(filePath: string): SuiteExecutionInline {
    const execution: SuiteExecutionInline = new SuiteExecutionInline();
    execution.executePath(filePath);
    return execution;
  }

  public static executeSuite(config: SuiteConfig): SuiteExecutionInline {
    const execution: SuiteExecutionInline = new SuiteExecutionInline();
    execution.executeSuite(config);
    return execution;
  }

  protected async _execute(filePath: string): Promise<SuiteExecutionResult> {
    // Start with success
    let exitCode: number = SuiteExecutionExitCode.success;
    // Override the automatically print value
    const opts = FlagpoleExecution.global.clone({
      automaticallyPrintToConsole: true,
    });
    // Save current global output options
    const globalOpts = FlagpoleExecution.global.clone();
    // Set it to our temporary opts
    FlagpoleExecution.global = opts;
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
      const promises: Promise<void>[] = [];
      createdSuites.forEach((suite: iSuite) => {
        promises.push(suite.finished);
      });
      // Wait for every suite to finish executing
      await Promise.all(promises);
      // Loop through the added suites again and capture output
      await asyncForEach(createdSuites, async (suite: iSuite) => {
        if (suite.hasFailed) {
          exitCode = SuiteExecutionExitCode.failure;
        }
        const report: FlagpoleReport = new FlagpoleReport(suite);
        this._logLine(await report.toString());
      });
    }
    FlagpoleExecution.global = globalOpts;
    return new SuiteExecutionResult(this._output, exitCode);
  }
}
