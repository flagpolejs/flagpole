import { FlagpoleExecution } from "../flagpoleexecution";
import { iSuiteOpts, iScenarioOpts, SuiteConfig } from "./config";
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
  if (!FlagpoleExecution.config) {
    throw "Flagpole config not found";
  }
  const suiteConfig = new SuiteConfig(FlagpoleExecution.config, suite);
  const suitePath: string = suiteConfig.getSourcePath();
  let fileContents: string = FlagpoleExecution.config.project.isTypeScript
    ? `import { Flagpole } from "flagpole";`
    : `const { Flagpole } = require("flagpole");`;
  fileContents +=
    "\n\n" +
    `const suite = Flagpole.suite('${suite.description || ""}');` +
    "\n\n" +
    `suite.${scenario.type}("${scenario.description}")` +
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
  FlagpoleExecution.config.addSuite(suite);
  await FlagpoleExecution.config.save();
  return suite;
};

export const addScenario = async (
  suite: SuiteConfig,
  opts: iScenarioOpts
): Promise<void> => {
  const suitePath: string = suite.getSourcePath();
  const fileContents: string =
    "\n\n" +
    `suite.${opts.type}("${opts.description}")` +
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

/*

static getCredentials(): Promise<{ email: string; token: string }> {
  const serviceName: string = "Flagpole JS";
  const service: ClorthoService = new ClorthoService(serviceName);
  let token: string;
  let email: string;
  return new Promise((resolve, reject) => {
    Promise.all([
      new Promise((resolve, reject) => {
        service
          .get("token")
          .then(function (credentials: iCredentials) {
            token = credentials.password;
            resolve();
          })
          .catch(function () {
            reject("No saved token.");
          });
      }),
      new Promise((resolve, reject) => {
        service
          .get("email")
          .then(function (credentials: iCredentials) {
            email = credentials.password;
            resolve();
          })
          .catch(function () {
            reject("No saved email.");
          });
      }),
    ])
      .then(function () {
        resolve({
          email: email,
          token: token,
        });
      })
      .catch(function (err) {
        reject("Not logged in. " + err);
      });
  });
}

static findJsFilesInTestFolder(): string[] {
  let startFolder: string = Cli.config.getTestsFolder();
  let suitesInFolder: string[] = [];

  function findSuites(dir: string, isSubFolder: boolean = false) {
    // Does this folder exist?
    if (fs.existsSync(dir)) {
      // Read contents
      let files = fs.readdirSync(dir);
      files.forEach(function (file) {
        // Drill into sub-folders, but only once!
        if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
          findSuites(`${dir}${file}${sep}`, true);
        }
        // Push in any JS files
        else if (file.match(/.js$/)) {
          let name: string = (dir + file)
            .replace(startFolder, "")
            .replace(/\.js$/i, "");
          suitesInFolder.push(name);
        }
      });
    }
  }

  findSuites(startFolder);
  return suitesInFolder;
}

static findDetachedSuites(): string[] {
  const suitesInFolder: string[] = Cli.findJsFilesInTestFolder();
  let suitesAvailableToImport: string[] = [];
  let suitesInConfig: string[] = Cli.config.getSuiteNames();
  suitesInFolder.forEach(function (suiteName: string) {
    if (!suitesInConfig.includes(suiteName)) {
      suitesAvailableToImport.push(suiteName);
    }
  });
  return suitesAvailableToImport;
}

static async addScenario(
  suite: SuiteConfig,
  opts: iScenarioOpts
): Promise<void> {
  return new Promise((resolve, reject) => {
    const suitePath: string = suite.getSourcePath();
    const fileContents: string =
      "\n\n" +
      `suite.${opts.type}("${opts.description}")` +
      "\n" +
      `   .open("${opts.path}")` +
      "\n" +
      `   .next(async (context) => {` +
      "\n" +
      `       ` +
      "\n" +
      `   });` +
      "\n";
    if (!fs.existsSync(suitePath)) {
      reject(`Suite file ${suitePath} does not exist.`);
    }
    fs.appendFile(suitePath, fileContents, function (err: string) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

static async init(opts: iConfigOpts): Promise<string[]> {
  return new Promise(async (resolve) => {
    const configFile: FlagpoleConfig = new FlagpoleConfig(opts);
    let tasks: string[] = [];
    // Add environemnts
    opts.environments.forEach((envName) => {
      configFile.addEnvironment(envName);
    });
    // Create root folder
    const rootFolder = configFile.getRootFolder();
    if (!fs.existsSync(rootFolder)) {
      fs.mkdirSync(rootFolder);
      tasks.push(
        configFile.project.isSourceAndOutput
          ? `Created root folder: ${rootFolder}`
          : `Created tests folder: ${rootFolder}`
      );
    } else {
      tasks.push(
        configFile.project.isSourceAndOutput
          ? `Root folder already existed: ${rootFolder}`
          : `Tests folder already existed: ${rootFolder}`
      );
    }
    // Save config
    await configFile.save();
    tasks.push("Saved config file.");
    if (configFile.project.isSourceAndOutput) {
      await configFile.writeTsConfig();
      tasks.push("Created tsconfig.json file.");
      const sourceFolder = configFile.getSourceFolder();
      if (!fs.existsSync(sourceFolder)) {
        fs.mkdirSync(sourceFolder);
        tasks.push("Created source folder: " + sourceFolder);
      }
      const outputFolder = configFile.getTestsFolder();
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
        tasks.push("Created output folder: " + outputFolder);
      }
    }
    parseConfigFile(configFile.getConfigPath());
    resolve(tasks);
  });
}

export function refreshConfig(): FlagpoleConfig {
  // Default Config
  const defaultConfig = {
    project: {
      name: path.basename(process.cwd()),
      path: "tests",
    },
    environments: [],
    suites: [],
  };
  // Is there a config file?
  if (Cli.configFileExists()) {
    // Read the file
    const configContent: string = fs.readFileSync(Cli.configPath);
    let configData: any = null;
    try {
      configData = JSON.parse(configContent);
    } catch {
      configData = {};
    }
    const opts: iConfigOpts = {
      project: Object.assign(defaultConfig.project, configData.project || {}),
      environments: Object.values(
        Object.assign(defaultConfig.environments, configData.environments || {})
      ),
      suites: Object.values(
        Object.assign(defaultConfig.suites, configData.suites || {})
      ),
    };
    Cli.config = new FlagpoleConfig(opts);
  }
  // No config file, so set defaults
  else {
    Cli.config = new FlagpoleConfig(defaultConfig);
  }
  Cli.config.onSave(refreshConfig);
  return Cli.config;
}

export function parseConfigFile(configPath: string): FlagpoleConfig {
  Cli.configPath = configPath;
  return refreshConfig();
}

*/
