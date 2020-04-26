import commander = require("commander");
import { FlagpoleExecution } from "../flagpoleexecution";

export interface iCliCommandOption {
  flags: string;
  description: string;
  default?: string | boolean;
  format?: (newValue: string, oldValue: any) => any;
}

export class CliCommandOption {
  public flags: string;
  public description: string;
  public default: string | boolean | undefined;
  public format: undefined | ((newValue: string, oldValue: any) => any);
  public helpCallback: Function | undefined;

  constructor(opts: iCliCommandOption) {
    this.flags = opts.flags;
    this.description = opts.description;
    this.default = opts.default;
    this.format = opts.format;
  }
}

export abstract class Command {
  public abstract commandString: string;
  public isHidden: boolean = false;
  public isDefault: boolean = false;
  public noHelp: boolean = false;
  public options: CliCommandOption[] = [];

  public init(program: commander.Command) {
    const command = program.command(this.commandString, {
      hidden: this.isHidden,
      noHelp: this.noHelp,
      isDefault: this.isDefault,
    });
    this.options.forEach((option) => {
      if (option.format) {
        command.option(
          option.flags,
          option.description,
          option.format,
          option.default
        );
      } else {
        command.option(option.flags, option.description, option.default);
      }
    });
    command.on("--help", this.helpCallback);
    command.action(async (...args: any[]) => {
      // Initialize Flagpole
      await FlagpoleExecution.setGlobalExecutionScope({
        configFilePath: program.config,
        environmentName: program.env,
        exitOnDone: !!program.exitOnDone,
        isChildProcess: !!program.isChildProcess,
        baseDomain: program.base,
        outputFormat: program.output,
        verbosity: program.quiet ? -100 : 0,
        automaticallyPrintToConsole: true,
      });
      // Call the action callback
      this.action.apply(this, args);
    });
  }

  public async action(...args: any[]) {}
  public helpCallback(...args: any[]) {}
}
