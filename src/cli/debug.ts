import { Cli } from "./cli";
import { FlagpoleExecution } from "../flagpoleexecutionoptions";

export function debug(argv) {
  Cli.log("DEBUG INFO");
  Cli.log("");
  Cli.log("Config File:");
  Cli.list([
    "Path: " + Cli.config.getConfigPath(),
    "Exists: " + Cli.configFileExists(),
    "Status: " + (Cli.config.isValid() ? "Valid" : "Invalid")
  ]);
  Cli.log("");
  if (Cli.config.isValid()) {
    Cli.log("Config Values:");
    Cli.list([
      "Config file directory: " + Cli.config.getConfigFolder(),
      "Tests directory: " + Cli.config.getTestsFolder()
    ]);
  }
  Cli.log("");
  Cli.log("Settings:");
  Cli.list([
    "Environment: " + FlagpoleExecution.opts.environment,
    "Output: " + FlagpoleExecution.opts.output.toString(),
    "Project Path: " + Cli.config.getConfigFolder(),
    "Tests Root Path: " + Cli.config.getRootFolder(),
    "Tests Source Path: " + Cli.config.getSourceFolder(),
    "Tests Output Path: " + Cli.config.getTestsFolder()
  ]);
  Cli.log("");
  Cli.exit(0);
}
