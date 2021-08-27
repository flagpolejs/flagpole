import {
  HeadingLine,
  CommentLine,
  LineBreak,
  PassLine,
  FailLine,
} from "./consoleline";
import { LogComment } from "./comment";
import { iConsoleLine, iLogItem, iScenario, iSuite } from "../interfaces";
import { asyncForEach } from "../util";
import { FlagpoleExecution } from "../flagpoleexecution";
import { lineToVerbosity } from "./verbosity";
import { ensureDirSync, readFile, writeFileSync } from "fs-extra";
import * as path from "path";

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
      new CommentLine(
        `Environment: ${FlagpoleExecution.global.environment?.name}`
      )
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
        if (item.type.startsWith("result")) {
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
            <li>Environment: ${FlagpoleExecution.global.environment?.name}</li>
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
        if (item.type.startsWith("result") || item.type == "comment") {
          html += item.toHtml();
        }
      });
      html += "</ul>\n";
      html += "</section>\n";
    }
    html += "</article>\n";
    return html;
  }

  /**
   * Create XML output for results
   */
  public async toXML(): Promise<string> {
    const scenarios: iScenario[] = this.suite.scenarios;

    const testCases: string[] = []

    for (let i = 0; i < scenarios.length; i++) {
      const scenario: iScenario = scenarios[i];
      const log = await scenario.getLog();

      log.forEach((item: iLogItem) => {

        if (item.type.startsWith("result")) {

          let testCase = '';

          if (item.type === "resultFailure") {
            testCase += `<testcase id="${item.timestamp}" name="${scenario.title}" time="${scenario.executionDuration}">`
            testCase += `<failure message="${item.message}" type="WARNING">`
            testCase += item.message
            if (item['_rawDetails']) {
              testCase += ` - ${item['_rawDetails'].join(' - ').replace(/\s+/g, ' ').trim()}`
            }
            testCase += `</failure></testcase>`
          } else {
            testCase += `<testcase id="${item.timestamp}" name="${scenario.title}" time="${scenario.executionDuration}"></testcase>`
          }

          testCases.push(testCase)
        }
      })

    }

    let xml = `<testsuite id="${this.suite.title}" name="${this.suite.title}" tests="${testCases.length}" failures="${this.suite.failCount}" time="${this.suite.executionDuration}ms}">`
    xml += testCases.join('')
    xml += `</testsuite>`

    return xml;
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
    return new Promise(async (resolve, reject) => {
      try {
        let output = await this.toString();

        if (FlagpoleExecution.global.isXmlOutput) {
          // write the output to a file in the reports/ directory
          await this.printXMLReport(output)
        }

        const lines = output.split("\n");

        lines.forEach((line) => {
          // node child process has a 8192 character limit
          const chunks = line.match(/.{1,8192}/g) || []
          chunks.forEach((chunk) => {
            // send the chunks
            process.send ? process.send(chunk) : console.log(chunk);
          })
        });
        // wait for the chunks to send before resolving and exiting the process
        setTimeout(() => {
          resolve()
        }, 0);
      } catch (error) {
        reject(error)
      }
    })
  }

  public async toString(): Promise<string> {
    let out: string = "";
    // HTML
    if (FlagpoleExecution.global.shouldWriteHtml) {
      out += await this.toHTML();
    }
    // XML
    if (FlagpoleExecution.global.isXmlOutput) {
      out += await this.toXML();
    }
    // JSON
    else if (FlagpoleExecution.global.isJsonOutput) {
      const json: any = await this.toJson();
      out += JSON.stringify(json, null, 2);
    }
    // Console
    else if (FlagpoleExecution.global.shouldOutputToConsole) {
      (await this.toConsole()).forEach((line: iConsoleLine) => {
        if (lineToVerbosity[line.type] <= FlagpoleExecution.global.volume) {
          out += line.toConsoleString() + "\n";
        }
      });
    }
    // Text
    else if (FlagpoleExecution.global.isTextOutput) {
      (await this.toConsole()).forEach((line: iConsoleLine) => {
        if (lineToVerbosity[line.type] >= FlagpoleExecution.global.volume) {
          out += line.toString() + "\n";
        }
      });
    }
    // CSV
    else if (FlagpoleExecution.global.isDelimitedOutput) {
      const format = FlagpoleExecution.global.outputFormat;
      (await this.toDelimited(format)).forEach((line: string) => {
        out += line + "\n";
      });
    }
    return out;
  }

  public async printXMLReport(report: string): Promise<null> {
    return new Promise(async (resolve, reject) => {
      const reportsFolder = FlagpoleExecution.global.config.getReportsFolder();

      if (!reportsFolder) {
        throw "Flagpole reports folder path not found.";
      }

      ensureDirSync(reportsFolder);

      const d = new Date()
      const date = d.getMonth() + 1 + '-' + d.getDate() + '-' + d.getFullYear()
      const reportFileName = `${date}-report.xml`
      const reportPath = path.join(reportsFolder, reportFileName)

      readFile(reportPath, 'utf8', async (err, data) => {

        if (err == null) {
          // if the file exists
          // remove the </testsuites> tag 
          const fileLines = data.split('\n');
          fileLines.splice(fileLines.length - 1, 1);
          const noClosingTag = fileLines.join('\n');

          // append the output and close the tag again
          report = `${noClosingTag}\n${report}\n</testsuites>`
          writeFileSync(reportPath, report)
          process.send ? process.send(`Writing report to ${reportPath}`) : console.log(`Writing report to ${reportPath}`);
          resolve()
        } else if (err.code === 'ENOENT') {
          // if the file doesn't exist
          // start a fresh xml file
          report = `<?xml version="1.0" encoding="UTF-8" ?>\n<testsuites>\n${report}\n</testsuites>`
          writeFileSync(reportPath, report);
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }
}
