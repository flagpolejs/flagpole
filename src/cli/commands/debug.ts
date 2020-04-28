import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";

export default class Debug extends Command {
  public commandString = "debug";
  public description = "give some debug information";
  public async action() {
    Cli.subheader("DEBUG INFO");
    Cli.log("", "Settings:")
      .list([
        "Environment: " + FlagpoleExecution.environmentName,
        "Config file directory: " + FlagpoleExecution.config?.getConfigFolder(),
        "Config path: " + FlagpoleExecution.config?.getConfigPath(),
        "Project Path: " + FlagpoleExecution.config?.getConfigFolder(),
        "Tests Root Path: " + FlagpoleExecution.config?.getRootFolder(),
        "Tests Source Path: " + FlagpoleExecution.config?.getSourceFolder(),
        "Tests Output Path: " + FlagpoleExecution.config?.getTestsFolder(),
        "Base Domain: " + FlagpoleExecution.baseDomain,
        "Output format: " + FlagpoleExecution.opts.outputFormat,
        "Verbosity: " + FlagpoleExecution.opts.verbosity,
        "Opts: " + FlagpoleExecution.opts.toString(),
      ])
      .log("")
      .exit(0);
  }
}
