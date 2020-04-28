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
        "Environment: " + FlagpoleExecution.global.environment?.name,
        "Config file directory: " +
          FlagpoleExecution.global.config.getConfigFolder(),
        "Config path: " + FlagpoleExecution.global.config.getConfigPath(),
        "Project Path: " + FlagpoleExecution.global.config.getConfigFolder(),
        "Tests Root Path: " + FlagpoleExecution.global.config.getRootFolder(),
        "Tests Source Path: " +
          FlagpoleExecution.global.config.getSourceFolder(),
        "Tests Output Path: " +
          FlagpoleExecution.global.config.getTestsFolder(),
        "Base Domain: " + FlagpoleExecution.global.baseDomain,
        "Output format: " + FlagpoleExecution.global.outputFormat,
        "Verbosity: " + FlagpoleExecution.global.verbosity,
        "Opts: " + FlagpoleExecution.global.getOptionsString(),
      ])
      .log("")
      .exit(0);
  }
}
