import {
  FlagpoleConfig,
  SuiteConfig,
  iScenarioOpts,
  iSuiteOpts,
  iConfigOpts
} from "./config";
import { ClorthoService, iCredentials } from "clortho-lite";
import { printHeader } from "./cli-helper";

const fs = require("fs");
const path = require("path");

export class Cli {
  static consoleLog: string[] = [];
  static hideBanner: boolean = false;
  static projectPath: string = process.cwd();
  static configPath: string = path.join(__dirname, "flagpole.json");
  static config: FlagpoleConfig;
  static command: string | null = null;
  static commandArg: string | null = null;
  static commandArg2: string | null = null;
  static apiDomain: string =
    "https://us-central1-flagpolejs-5ea61.cloudfunctions.net";

  static configFileExists(): boolean {
    return Cli.configPath && fs.existsSync(Cli.configPath);
  }

  static isInitialized(): boolean {
    return Cli.configFileExists() && Cli.config && Cli.config.isValid();
  }

  static log(message: string) {
    if (typeof message !== "undefined") {
      Cli.consoleLog.push(message.replace(/\n$/, ""));
    }
  }

  static list(list: Array<string>) {
    list.forEach(function(message: string) {
      Cli.log("  » " + message);
    });
  }

  static exit(exitCode: number) {
    if (!Cli.hideBanner) {
      printHeader();
    }
    Cli.consoleLog.forEach(output => {
      const lines = output.split("\n");
      lines.forEach(line => {
        process.send ? process.send(line) : console.log(line);
      });
    });
    process.exit(exitCode);
  }

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
            .then(function(credentials: iCredentials) {
              token = credentials.password;
              resolve();
            })
            .catch(function() {
              reject("No saved token.");
            });
        }),
        new Promise((resolve, reject) => {
          service
            .get("email")
            .then(function(credentials: iCredentials) {
              email = credentials.password;
              resolve();
            })
            .catch(function() {
              reject("No saved email.");
            });
        })
      ])
        .then(function() {
          resolve({
            email: email,
            token: token
          });
        })
        .catch(function(err) {
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
        files.forEach(function(file) {
          // Drill into sub-folders, but only once!
          if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
            findSuites(dir + file + "/", true);
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
    suitesInFolder.forEach(function(suiteName: string) {
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
        `   .next(async context => {` +
        "\n" +
        `       ` +
        "\n" +
        `   });` +
        "\n";
      if (!fs.existsSync(suitePath)) {
        reject(`Suite file ${suitePath} does not exist.`);
      }
      fs.appendFile(suitePath, fileContents, function(err: string) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  static async addSuite(
    suite: iSuiteOpts,
    scenario: iScenarioOpts
  ): Promise<iSuiteOpts> {
    return new Promise((resolve, reject) => {
      const suiteConfig = new SuiteConfig(Cli.config, suite);
      const suitePath: string = suiteConfig.getSourcePath();
      let fileContents: string = Cli.config.project.isSourceAndOutput
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
        `   .next(async context => {` +
        "\n" +
        `       ` +
        "\n" +
        `   });` +
        "\n\n";
      fs.writeFile(suitePath, fileContents, function(err: string) {
        if (err) {
          return reject(err);
        }
        Cli.config.addSuite(suite);
        Cli.config
          .save()
          .then(() => {
            resolve(suite);
          })
          .catch(reject);
      });
    });
  }

  static async init(opts: iConfigOpts): Promise<string[]> {
    return new Promise(async resolve => {
      const configFile: FlagpoleConfig = new FlagpoleConfig(opts);
      let tasks: string[] = [];
      // Add environemnts
      opts.environments.forEach(envName => {
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
}

export function refreshConfig(): FlagpoleConfig {
  // Default Config
  const defaultConfig = {
    project: {
      name: path.basename(process.cwd()),
      path: "tests"
    },
    environments: [{ name: "dev", defaultDomain: "" }],
    suites: []
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
      )
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
