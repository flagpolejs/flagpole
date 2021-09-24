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
          const message = this.cleanXMLCharacters(item.message)

          if (item.type === "resultFailure") {
            testCase += `<testcase id="${item.timestamp}" name="${scenario.title}">`
            testCase += `<failure message="${message}" type="WARNING">`
            testCase += message
            if (item['detailsMessage']) {
              const rawDetails = this.cleanXMLCharacters(` - ${item['detailsMessage'].join(' - ').replace(/\s+/g, ' ').trim()}`)
              testCase += rawDetails
            }
            testCase += `</failure></testcase>`
          } else {
            testCase += `<testcase id="${item.timestamp}" name="${scenario.title}"></testcase>`
          }

          testCases.push(testCase)
        }
      })

    }

    const suiteDurantionInSeconds = this.suite.executionDuration! / 1000

    let xml = `<testsuite id="${this.suite.title}" name="${this.suite.title}" tests="${testCases.length}" failures="${this.suite.failCount}" time="${suiteDurantionInSeconds}">`
    xml += testCases.join('')
    xml += `</testsuite>`

    return xml;
  }

  /**
   * Create CI output for results
   * Details on failures only
   */
  public async toCI(): Promise<string> {

    const scenarios: iScenario[] = this.suite.scenarios;

    let ciOutput: string[] = []

    for (let i = 0; i < scenarios.length; i++) {
      const scenario: iScenario = scenarios[i];
      const log = await scenario.getLog();

      // .next("I am a subscenario title", async context => { })
      let subScenarioTitle: string

      log.forEach((item: iLogItem) => {

        if (item.className === "heading") {
          subScenarioTitle = item.message
        }

        if (item.type.startsWith("result")) {

          const message = item.message

          if (item.type === "resultFailure") {
            ciOutput.push('---FAILURE---')
            ciOutput.push(`Suite: ${this.suite.title}`)
            ciOutput.push(`Scenario: ${scenario.title} - ${subScenarioTitle}`)
            ciOutput.push(`Assertion: ${message}`)
            ciOutput.push(item['detailsMessage'].join(' - ').replace(/\s+/g, ' ').trim())
          }
        }
      })
    }
    return ciOutput.join("\n")
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
        const output = await this.toString();

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
    let out = "";

    switch (true) {
      // HTML
      case FlagpoleExecution.global.shouldWriteHtml:
        return this.toHTML();
      // JSON
      case FlagpoleExecution.global.isJsonOutput:
        const json: any = await this.toJson();
        return JSON.stringify(json, null, 2);
      // CSV
      case FlagpoleExecution.global.isDelimitedOutput:
        const format = FlagpoleExecution.global.outputFormat;
        (await this.toDelimited(format)).forEach((line: string) => {
          out += line + "\n";
        });
        return out;
      // XML
      case FlagpoleExecution.global.isXmlOutput:
        return this.toXML();
      // Text
      case FlagpoleExecution.global.isTextOutput:
        (await this.toConsole()).forEach((line: iConsoleLine) => {
          if (lineToVerbosity[line.type] <= FlagpoleExecution.global.volume) {
            out += line.toString() + "\n";
          }
        });
        return out;
      case FlagpoleExecution.global.isCiOutput:
        return this.toCI();
      // Console
      default:
        (await this.toConsole()).forEach((line: iConsoleLine) => {
          if (lineToVerbosity[line.type] <= FlagpoleExecution.global.volume) {
            out += line.toConsoleString() + "\n";
          }
        });
        return out;
    }
  }

  /**
   * There are 5 pre-defined entity references in XML:
   * @param unsafe message possibly containing forbidden XML characters
   * @returns safe message for XML
   */
  private cleanXMLCharacters(unsafe: string): string {

    return unsafe.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
