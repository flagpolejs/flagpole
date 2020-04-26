import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";

export default class Debug extends Command {
  public commandString = "debug";
  public async action() {
    Cli.subheader("DEBUG INFO")
      .log("", "Config File:")
      .list(["Path: " + FlagpoleExecution.config?.getConfigPath()])
      .log("");
    if (FlagpoleExecution.config) {
      Cli.log("Config Values:").list([
        "Config file directory: " + FlagpoleExecution.config.getConfigFolder(),
        "Tests directory: " + FlagpoleExecution.config.getTestsFolder(),
      ]);
    }
    Cli.log("", "Settings:")
      .list([
        "Environment: " + FlagpoleExecution.environmentName,
        "Project Path: " + FlagpoleExecution.config?.getConfigFolder(),
        "Tests Root Path: " + FlagpoleExecution.config?.getRootFolder(),
        "Tests Source Path: " + FlagpoleExecution.config?.getSourceFolder(),
        "Tests Output Path: " + FlagpoleExecution.config?.getTestsFolder(),
      ])
      .log("")
      .exit(0);
  }
}
