import { FlagpoleExecution } from "../flagpoleexecution";
import { iSuiteOpts, iScenarioOpts, SuiteConfig } from "../flagpoleconfig";
import * as fs from "fs-extra";
import { printSubheader } from "./cli-helper";

export class Cli {
  private static _singleton: Cli;

  public static createSingleton(): Cli {
    if (!Cli._singleton) {
      Cli._singleton = new Cli();
    }
    return Cli._singleton;
  }

  public static get instance(): Cli {
    return Cli.createSingleton();
  }

  static fatalError(message: string, exitCode: number = 1) {
    Cli.log(message).exit(exitCode);
  }

  static subheader(message: string): Cli {
    return Cli.instance.subheader(message);
  }

  static log(...messages: string[]): Cli {
    return Cli.instance.log.apply(Cli.instance, messages);
  }

  static list(...messages: string[] | string[][]): Cli {
    return Cli.instance.list.apply(Cli.instance, messages);
  }

  static exit(exitCode: number) {
    return Cli.instance.exit(exitCode);
  }

  private constructor() {}

  private _consoleLog: string[] = [];

  private stripLineBreaks(message: string) {
    return message.replace(/\n$/, "");
  }

  public subheader(heading: string): Cli {
    printSubheader(this.stripLineBreaks(heading));
    return this;
  }

  public log(...messages: string[]): Cli {
    messages.forEach((message) => {
      this._consoleLog.push(this.stripLineBreaks(message));
    });
    return this;
  }

  public list(...messages: string[] | string[][]): Cli {
    const log = (message: string) => {
      this.log("  » " + this.stripLineBreaks(message));
    };
    messages.forEach((message: string | string[]) => {
      // single message
      if (typeof message === "string") {
        log(message);
      }
      // multiple messages in an array
      else {
        message.forEach((subMessage) => {
          log(subMessage);
        });
      }
    });
    return this;
  }

  public exit(exitCode: number) {
    this._consoleLog.forEach((output) => {
      const lines = output.split("\n");
      lines.forEach((line) => {
        process.send ? process.send(line) : console.log(line);
      });
    });
    process.exit(exitCode);
  }
}

export const addSuite = async (
  suite: iSuiteOpts,
  scenario: iScenarioOpts
): Promise<iSuiteOpts> => {
  if (!FlagpoleExecution.global.config) {
    throw "Flagpole config not found";
  }
  const suiteConfig = new SuiteConfig(FlagpoleExecution.global.config, suite);
  const suitePath: string = suiteConfig.getSourcePath();
  let fileContents: string = FlagpoleExecution.global.config.project
    .isTypeScript
    ? `import flagpole from "flagpole";`
    : `const flagpole = require("flagpole");`;
  fileContents +=
    "\n\n" +
    `const suite = flagpole('${suite.description || ""}');` +
    "\n\n" +
    `suite.scenario("${scenario.description}", "${scenario.type}")` +
    "\n" +
    `   .open("${scenario.path}")` +
    "\n" +
    `   .next(async (context) => {` +
    "\n" +
    `       ` +
    "\n" +
    `   });` +
    "\n\n";
  await fs.writeFile(suitePath, fileContents);
  FlagpoleExecution.global.config.addSuite(suite);
  await FlagpoleExecution.global.config.save();
  return suite;
};

export const addScenario = async (
  suite: SuiteConfig,
  opts: iScenarioOpts
): Promise<void> => {
  const suitePath: string = suite.getSourcePath();
  const fileContents: string =
    "\n\n" +
    `suite.scenario("${opts.description}", "${opts.type}")` +
    "\n" +
    `   .open("${opts.path}")` +
    "\n" +
    `   .next(async (context) => {` +
    "\n" +
    `       ` +
    "\n" +
    `   });` +
    "\n";
  if (await fs.pathExists(suitePath)) {
    await fs.appendFile(suitePath, fileContents);
  } else {
    throw `Suite file ${suitePath} does not exist.`;
  }
};
