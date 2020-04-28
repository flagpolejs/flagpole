export const VERBOSITY_SILENT = -100;
export const VERBOSITY_NORMAL = 0;
export const VERBOSITY_VERBOSE = 100;

export enum FlagpoleOutput {
  console = "console",
  text = "text",
  json = "json",
  html = "html",
  csv = "csv",
  tsv = "tsv",
  psv = "psv",
  browser = "browser",
}

export interface iFlagpoleOptions {
  configFilePath?: string;
  outputFormat?: FlagpoleOutput;
  baseDomain?: string;
  environmentName?: string;
  exitOnDone?: boolean;
  isChildProcess?: boolean;
  verbosity?: number;
  automaticallyPrintToConsole?: boolean;
}

/**
 * This class should contain all of the options of how Flagpole should behave,
 * but not anything pertaining to the CLI itself.
 */
export class FlagpoleOptions implements iFlagpoleOptions {
  /**
   * Parse argument string to create an instance
   *
   * @param args
   */
  public static createFromString(args: string): FlagpoleOptions {
    return FlagpoleOptions.createWithArgs(args.split(" "));
  }

  /**
   * Parse string argument array to create an instance
   *
   * @param args
   */
  public static createWithArgs(args: string[]): FlagpoleOptions {
    const opts: iFlagpoleOptions = {};
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
      } else if (arg == "-q") {
        opts.verbosity = VERBOSITY_SILENT;
        lastArg = null;
        return;
      } else if (arg == "-x") {
        opts.exitOnDone = true;
        lastArg = null;
        return;
      } else if (arg == "-z") {
        opts.isChildProcess = true;
        lastArg = null;
        return;
      }
      lastArg = arg;
    });
    return new FlagpoleOptions(opts);
  }

  public readonly configFilePath: string | undefined;
  public readonly outputFormat: FlagpoleOutput;
  public readonly baseDomain: string | undefined;
  public readonly environmentName: string | undefined;
  public readonly exitOnDone: boolean;
  public readonly isChildProcess: boolean;
  public readonly verbosity: number;
  private readonly _automaticallyPrintToConsole: boolean;

  public get automaticallyPrintToConsole(): boolean {
    return this._automaticallyPrintToConsole && !this.isQuietMode;
  }

  public get isQuietMode(): boolean {
    return this.verbosity === VERBOSITY_SILENT;
  }

  public get executedFromCli(): boolean {
    return this.configFilePath !== undefined;
  }

  public get shouldOutputToConsole(): boolean {
    return this.isConsoleOutput && this.verbosity >= 0;
  }

  public get shouldWriteHtml(): boolean {
    return this.isHtmlOutput || this.isBrowserOutput;
  }

  public get isConsoleOutput(): boolean {
    return this.outputFormat === FlagpoleOutput.console;
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

  constructor(opts: iFlagpoleOptions) {
    this.configFilePath = opts.configFilePath;
    this.outputFormat = opts.outputFormat || FlagpoleOutput.console;
    this.baseDomain = opts.baseDomain;
    this.environmentName = opts.environmentName;
    this.exitOnDone = opts.exitOnDone === undefined ? false : !!opts.exitOnDone;
    this.isChildProcess =
      opts.isChildProcess === undefined ? false : !!opts.isChildProcess;
    this.verbosity = opts.verbosity === undefined ? 0 : opts.verbosity;
    this._automaticallyPrintToConsole =
      opts.automaticallyPrintToConsole === undefined
        ? false
        : opts.automaticallyPrintToConsole;
  }

  public clone(newOpts: iFlagpoleOptions) {
    return new FlagpoleOptions({
      configFilePath: newOpts.configFilePath || this.configFilePath,
      outputFormat: newOpts.outputFormat || this.outputFormat,
      baseDomain: newOpts.baseDomain || this.baseDomain,
      environmentName: newOpts.environmentName || this.environmentName,
      exitOnDone:
        newOpts.exitOnDone !== undefined ? newOpts.exitOnDone : this.exitOnDone,
      isChildProcess:
        newOpts.isChildProcess !== undefined
          ? newOpts.isChildProcess
          : this.isChildProcess,
      verbosity:
        newOpts.verbosity !== undefined ? newOpts.verbosity : this.verbosity,
    });
  }

  public toString(): string {
    let opts: string = "";
    if (this.baseDomain) {
      opts += ` --base ${this.baseDomain}`;
    }
    if (this.configFilePath) {
      opts += ` --config ${this.configFilePath}`;
    }
    if (this.environmentName !== undefined) {
      opts += " -e " + this.environmentName;
    }
    if (this.verbosity === VERBOSITY_SILENT) {
      opts += " -q";
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
    return opts;
  }

  public toArgs(): string[] {
    const str = this.toString().trim();
    return str.split(" ");
  }
}
