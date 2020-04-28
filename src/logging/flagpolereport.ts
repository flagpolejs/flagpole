import {
  HeadingLine,
  CommentLine,
  LineBreak,
  PassLine,
  FailLine,
} from "./consoleline";
import { LogComment } from "./comment";
import { iConsoleLine, iLogItem, iScenario, iSuite } from "../interfaces";
import { LogItemType } from "../enums";
import { asyncForEach } from "../util";
import { FlagpoleExecution } from "../flagpoleexecution";

export class FlagpoleReport {
  public readonly suite: iSuite;

  constructor(suite: iSuite) {
    this.suite = suite;
  }

  /**
   * Get ASCII formatted string with colors from output lines, ready to go to console
   */
  public async toConsole(): Promise<iConsoleLine[]> {
    let lines: iConsoleLine[] = [];
    lines.push(new HeadingLine(this.suite.title));
    lines.push(new CommentLine(`Base URL: ${this.suite.baseUrl}`));
    lines.push(
      new CommentLine(`Environment: ${FlagpoleExecution.environmentName}`)
    );
    lines.push(new CommentLine(`Took ${this.suite.executionDuration}ms`));
    const failCount: number = this.suite.failCount;
    const totalCount: number = this.suite.scenarios.length;
    failCount == 0
      ? lines.push(
          new PassLine(
            `Passed (${totalCount} scenario${totalCount == 1 ? "" : "s"})`
          )
        )
      : lines.push(
          new FailLine(
            `Failed (${failCount} of ${totalCount} scenario${
              totalCount == 1 ? "" : "s"
            })`
          )
        );
    lines.push(new LineBreak());
    await asyncForEach(this.suite.scenarios, async (scenario: iScenario) => {
      const log = await scenario.getLog();
      log.forEach((item: iLogItem) => {
        lines = lines.concat(item.toConsole());
      });
      lines.push(new LineBreak());
    });

    return lines;
  }

  /**
   * Get JSON output
   *
   * @returns {any}
   */
  public async toJson(): Promise<any> {
    const scenarios: iScenario[] = this.suite.scenarios;
    let out: any = {
      title: this.suite.title,
      baseUrl: String(this.suite.baseUrl),
      summary: {},
      scenarios: [],
    };
    let failCount: number = 0;
    let passCount: number = 0;
    for (let i = 0; i < scenarios.length; i++) {
      let scenario: iScenario = scenarios[i];
      const log: iLogItem[] = await scenario.getLog();
      out.scenarios[i] = {
        title: scenario.title,
        done: scenario.hasFinished,
        failCount: 0,
        passCount: 0,
        log: [],
      };
      log.forEach((item: iLogItem) => {
        out.scenarios[i].log.push(item.toJson());
        if (item.type == LogItemType.Result) {
          if (item.passed) {
            out.scenarios[i].passCount++;
            passCount++;
          } else if (item.failed && item.isOptional) {
            out.scenarios[i].failCount++;
            failCount++;
          }
        }
      });
    }
    out.summary = {
      passed: failCount == 0,
      passCount: passCount,
      failCount: failCount,
      duration: this.suite.executionDuration,
    };
    return out;
  }

  /**
   * Create HTML output for results
   */
  public async toHTML(): Promise<string> {
    const scenarios: iScenario[] = this.suite.scenarios;
    let html: string = "";
    html += '<article class="suite">' + "\n";
    html += `<h2>${this.suite.title}</h2>\n`;
    html += "<aside>\n";
    html += "<ul>\n";
    html += `
            <li>Duration: ${this.suite.executionDuration}ms</li>
            <li>Base URL: ${this.suite.baseUrl}</li>
            <li>Environment: ${FlagpoleExecution.environment?.name}</li>
        `;
    html += "</ul>\n";
    html += "</aside>\n";
    for (let i = 0; i < scenarios.length; i++) {
      let scenario: iScenario = scenarios[i];
      const log = await scenario.getLog();
      html += '<section class="scenario">' + "\n";
      html += `
                <h3>${scenario.title}</h3>
            `;
      html += "<ul>\n";
      log.forEach((item: iLogItem) => {
        if (
          item.type == LogItemType.Result ||
          item.type == LogItemType.Comment
        ) {
          html += item.toHtml();
        }
      });
      html += "</ul>\n";
      html += "</section>\n";
    }
    html += "</article>\n";
    return html;
  }

  public async toDelimited(format: string): Promise<string[]> {
    const funcName: string = `to${format.charAt(0).toUpperCase()}${format.slice(
      1
    )}`;
    if (!Reflect.has(new LogComment(""), funcName)) {
      throw new Error(`Method for ${funcName} does not exist.`);
    }
    let lines: string[] = [];
    await this.suite.scenarios.forEach(async function (scenario) {
      const log = await scenario.getLog();
      log.forEach((item: iLogItem) => {
        lines.push(item[funcName]());
      });
    });
    return lines;
  }

  public async print(): Promise<any> {
    const output = await this.toString();
    const lines = output.split("\n");
    lines.forEach((line) => {
      process.send ? process.send(line) : console.log(line);
    });
  }

  public async toString(): Promise<string> {
    let out: string = "";
    // HTML
    if (FlagpoleExecution.opts.shouldWriteHtml) {
      out += await this.toHTML();
    }
    // JSON
    else if (FlagpoleExecution.opts.isJsonOutput) {
      const json: any = await this.toJson();
      out += JSON.stringify(json, null, 2);
    }
    // Console
    else if (FlagpoleExecution.opts.isConsoleOutput) {
      (await this.toConsole()).forEach((line: iConsoleLine) => {
        out += line.toConsoleString() + "\n";
      });
    }
    // Text
    else if (FlagpoleExecution.opts.isTextOutput) {
      (await this.toConsole()).forEach((line: iConsoleLine) => {
        out += line.toString() + "\n";
      });
    }
    // CSV
    else if (FlagpoleExecution.opts.isDelimitedOutput) {
      const format = FlagpoleExecution.opts.outputFormat;
      (await this.toDelimited(format)).forEach((line: string) => {
        out += line + "\n";
      });
    }
    return out;
  }
}
