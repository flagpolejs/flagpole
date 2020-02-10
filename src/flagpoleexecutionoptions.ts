import { FlagpoleConfig } from "./cli/config";
import { parseConfigFile } from "./cli/cli";

export enum FlagpoleOutput {
  console = 1,
  text = 2,
  json = 3,
  html = 4,
  csv = 5,
  tsv = 6,
  psv = 7,
  browser = 8
}

export class FlagpoleExecutionOptions {
  /**
   * Set path to flagpole.json
   */
  public configPath: string = "";

  /**
   * Get config file
   */
  public config: FlagpoleConfig | undefined;

  /**
   * Set base path
   */
  public baseDomain: string = "";

  /**
   * There always has to be an environment, default to dev
   */
  public environment: string = "dev";

  /**
   * Do not write out any output
   */
  public quietMode: boolean = false;

  /**
   * Execute suite asynchronously
   */
  public asyncExecution: boolean = false;

  /**
   * If true will automatically print out test results to the console
   */
  public automaticallyPrintToConsole: boolean = false;

  /**
   * Once execution of a suite completes, exit the process
   */
  public exitOnDone: boolean = false;

  /**
   * If there is output, what format shoudl it be in?
   */
  public output: FlagpoleOutput = FlagpoleOutput.console;

  /**
   * Running as a child process
   */
  public isChildProcess: boolean = false;

  /**
   * Create a blank instance
   */
  public static create(): FlagpoleExecutionOptions {
    return new FlagpoleExecutionOptions();
  }

  /**
   * Parse argument string to create an instance
   *
   * @param args
   */
  public static createFromString(args: string): FlagpoleExecutionOptions {
    return FlagpoleExecutionOptions.createWithArgs(args.split(" "));
  }

  /**
   * Parse string argument array to create an instance
   *
   * @param args
   */
  public static createWithArgs(args: string[]): FlagpoleExecutionOptions {
    const opts = new FlagpoleExecutionOptions();
    let lastArg: string | null = null;
    let env: string | null = null;
    args.forEach(function(arg: string) {
      if (lastArg == "-e") {
        env = arg;
        opts.environment = env;
      } else if (lastArg == "-o") {
        opts.setOutputFromString(arg);
        opts.automaticallyPrintToConsole = true;
      } else if (lastArg == "--base") {
        opts.baseDomain = arg;
      } else if (lastArg == "--config") {
        opts.configPath = arg;
      } else if (arg == "-q") {
        opts.quietMode = true;
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
    // Load config file
    if (opts.configPath) {
      opts.config = parseConfigFile(opts.configPath);
    }
    return opts;
  }

  /**
   * Don't let this be constructed from outside, only use create static methods
   */
  private constructor() {}

  /**
   * Set the output value from a string, translate it to our enum
   *
   * @param value
   */
  public setOutputFromString(value: string) {
    if (typeof value == "string") {
      if (Object.keys(FlagpoleOutput).includes(value)) {
        if (parseInt(value) > 0) {
          this.output = <FlagpoleOutput>parseInt(value);
        } else {
          this.output = FlagpoleOutput[value];
        }
      }
    }
  }

  public getOutputAsString(): string {
    let out: string = "console";
    Object.keys(FlagpoleOutput).some(key => {
      if (FlagpoleOutput[key] == this.output) {
        out = key;
        return true;
      }
      return false;
    });
    return out;
  }

  /**
   * Turn this back into an execution string to use at command line
   */
  public toString(): string {
    let opts: string = "";
    if (this.baseDomain) {
      opts += ` --base ${this.baseDomain}`;
    }
    if (this.configPath) {
      opts += ` --config ${this.configPath}`;
    }
    if (this.environment !== null) {
      opts += " -e " + this.environment;
    }
    if (this.quietMode) {
      opts += " -q";
    }
    if (this.exitOnDone) {
      opts += " -x";
    }
    if (this.isChildProcess) {
      opts += " -z";
    }
    if (this.output !== null) {
      opts += " -o " + this.getOutputAsString();
    }
    return opts;
  }

  public toArgs(): string[] {
    const str = this.toString().trim();
    return str.split(" ");
  }
}

export class FlagpoleExecution {
  protected static _opts: FlagpoleExecutionOptions = FlagpoleExecutionOptions.createWithArgs(
    process.argv
  );

  public static get opts(): FlagpoleExecutionOptions {
    return this._opts;
  }

  public static set opts(value: FlagpoleExecutionOptions) {
    this._opts = value;
  }
}
