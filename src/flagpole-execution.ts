import {
  FlagpoleConfig,
  iConfigOpts,
  getDefaultConfig,
  EnvConfig,
} from "./flagpole-config";
import {
  readFileSync,
  ensureDirSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  emptyDirSync,
} from "fs-extra";
import * as path from "path";
import { toJson } from "./helpers";

export enum FlagpoleOutput {
  console = "console",
  ci = "ci",
  text = "text",
  json = "json",
  html = "html",
  csv = "csv",
  tsv = "tsv",
  psv = "psv",
  browser = "browser",
  xml = "xml",
}

export interface iFlagpoleOptions {
  configFilePath: string;
  outputFormat?: FlagpoleOutput;
  baseDomain?: string;
  environmentName?: string;
  exitOnDone?: boolean;
  isChildProcess?: boolean;
  volume?: number;
  automaticallyPrintToConsole?: boolean;
  headless?: boolean;
}

function loadOptsFromConfigFile(configFilePath: string): iConfigOpts {
  const defaultConfig = getDefaultConfig(configFilePath);
  // No config
  if (!existsSync(configFilePath)) {
    return defaultConfig;
  }
  // Read file
  const configContent: string = readFileSync(configFilePath, "utf8");
  // Parse JSON from the file, or catch it to return default
  const configData = toJson<iConfigOpts>(configContent);
  // Assemble our output
  return {
    project: {
      ...defaultConfig.project,
      ...configData.project,
    },
    environments: {
      ...defaultConfig.environments,
      ...configData.environments,
    },
    suites: configData.suites ? configData.suites : defaultConfig.suites,
  };
}

/**
 * Contains information about the current exeuction of Flagpole
 */
export class FlagpoleExecution {
  /**
   * STATIC PROPERTIES
   */

  private static _globalSingleton: FlagpoleExecution;

  public static get global(): FlagpoleExecution {
    if (!FlagpoleExecution._globalSingleton) {
      FlagpoleExecution.global = FlagpoleExecution.createWithArgs(process.argv);
    }
    return FlagpoleExecution._globalSingleton;
  }

  public static set global(value: FlagpoleExecution) {
    FlagpoleExecution._globalSingleton = value;
  }

  /**
   * Parse string argument array to create an instance
   *
   * @param args
   */
  public static createWithArgs(args: string[]): FlagpoleExecution {
    const opts: iFlagpoleOptions = {
      configFilePath: "./flagpole.json",
    };
    let lastArg: string | null = null;
    args.forEach(function (arg: string) {
      if (lastArg == "-e") {
        opts.environmentName = arg;
      } else if (lastArg == "-o") {
        opts.outputFormat = <FlagpoleOutput>arg;
        opts.automaticallyPrintToConsole = true;
      } else if (lastArg == "--base") {
        opts.baseDomain = arg;
      } else if (lastArg == "--config") {
        opts.configFilePath = arg;
      } else if (lastArg == "--volume") {
        opts.volume = parseInt(arg);
      } else if (arg == "-x") {
        opts.exitOnDone = true;
        lastArg = null;
        return;
      } else if (arg == "-z") {
        opts.isChildProcess = true;
        lastArg = null;
        return;
      } else if (arg == "--headless") {
        opts.headless = true;
        lastArg = null;
        return;
      } else if (arg == "--headed") {
        opts.headless = false;
        lastArg = null;
        return;
      }
      lastArg = arg;
    });
    return FlagpoleExecution.create(<iFlagpoleOptions>opts);
  }

  public static create(opts: iFlagpoleOptions): FlagpoleExecution {
    const configOptions = loadOptsFromConfigFile(
      opts.configFilePath || "./flagpole.json"
    );
    const defaultEnv = configOptions?.environments
      ? Object.values(configOptions?.environments)[0]
      : undefined;
    opts.environmentName = opts.environmentName || defaultEnv?.name;
    return new FlagpoleExecution(
      opts,
      new FlagpoleConfig(configOptions, opts.configFilePath)
    );
  }

  /**
   * INSTANCE PROPERTIES
   */

  private _opts: iFlagpoleOptions;
  private _config: FlagpoleConfig;

  public get config(): FlagpoleConfig {
    return this._config;
  }

  public get automaticallyPrintToConsole(): boolean {
    return !!this._opts.automaticallyPrintToConsole;
  }

  public get exitOnDone(): boolean {
    return !!this._opts.exitOnDone;
  }

  public get isChildProcess(): boolean {
    return !!this._opts.isChildProcess;
  }

  public get volume(): number {
    return this._opts.volume === undefined ? 50 : this._opts.volume;
  }

  public set outputFormat(value: FlagpoleOutput) {
    this._opts.outputFormat = value;
  }

  public get outputFormat(): FlagpoleOutput {
    return (this._opts.outputFormat =
      this._opts.outputFormat === undefined
        ? FlagpoleOutput.console
        : this._opts.outputFormat);
  }

  public get environment(): EnvConfig | undefined {
    return this._opts.environmentName
      ? this.config.environments[this._opts.environmentName]
      : this.config.defaultEnvironment;
  }

  public get baseDomain(): string | undefined {
    if (this._opts.baseDomain !== "undefined" && this._opts.baseDomain) {
      return this._opts.baseDomain;
    }

    return this.environment?.defaultDomain;
  }

  public get headless(): boolean | undefined {
    return this._opts.headless;
  }

  public set headless(value: boolean | undefined) {
    this._opts.headless = value;
  }

  public get isQuietMode(): boolean {
    return this.volume === 0;
  }

  public get shouldOutputToConsole(): boolean {
    return (this.isConsoleOutput || this.isCiOutput) && this.volume > 0;
  }

  public get shouldWriteHtml(): boolean {
    return this.isHtmlOutput || this.isBrowserOutput;
  }

  public get isConsoleOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.console;
  }

  public get isCiOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.ci;
  }

  public get isTextOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.text;
  }

  public get isCsvOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.csv;
  }

  public get isPsvOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.psv;
  }

  public get isDelimitedOutput(): boolean {
    return this.isTsvOutput || this.isPsvOutput || this.isCsvOutput;
  }

  public get isTsvOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.tsv;
  }

  public get isJsonOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.json;
  }

  public get isBrowserOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.browser;
  }

  public get isHtmlOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.html;
  }

  public get isXmlOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.xml;
  }

  private constructor(opts: iFlagpoleOptions, config: FlagpoleConfig) {
    this._opts = opts;
    this._config = config;
  }

  private getCachePath(cacheFileName?: string): string {
    const cacheFolder = FlagpoleExecution.global.config.getCacheFolder();
    if (!cacheFolder) {
      throw "Flagpole cache folder path not found.";
    }
    ensureDirSync(cacheFolder);
    return cacheFileName ? path.join(cacheFolder, cacheFileName) : cacheFolder;
  }

  public setCache(key: string, data: any) {
    writeFileSync(
      this.getCachePath(key),
      typeof data == "string" ? data : JSON.stringify(data, null, 2)
    );
    return this;
  }

  public getCache(key: string): any {
    const path = this.getCachePath(key);
    const data = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return data;
  }

  public removeCache(key: string) {
    const path = this.getCachePath(key);
    existsSync(path) && unlinkSync(path);
    return this;
  }

  public clearCache() {
    return emptyDirSync(this.getCachePath());
  }

  public getOptionsArray(): string[] {
    return this.getOptionsString().split(" ");
  }

  public getOptionsString(): string {
    let opts: string = `--volume ${this.volume}`;
    if (this.baseDomain) {
      opts += ` --base ${this._opts.baseDomain}`;
    }
    if (this.config) {
      opts += ` --config ${this.config.getConfigPath()}`;
    }
    if (this.environment !== undefined) {
      opts += " -e " + this.environment.name;
    }
    if (this.exitOnDone === true) {
      opts += " -x";
    }
    if (this.isChildProcess === true) {
      opts += " -z";
    }
    if (this.outputFormat !== undefined) {
      opts += " -o " + this.outputFormat;
    }
    if (this.headless !== undefined) {
      opts += ` --${this.headless ? "headless" : "headed"}`;
    }
    return opts;
  }

  public clone(opts?: any): FlagpoleExecution {
    const clonedExecution = new FlagpoleExecution(this._opts, this._config);
    if (opts) {
      Object.keys(opts).forEach((key) => {
        clonedExecution._opts[key] = opts[key];
      });
    }
    return clonedExecution;
  }
}
