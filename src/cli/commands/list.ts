import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";

export default class List extends Command {
  public commandString = "list [type]";
  public async action(type: string = "suites") {
    if (["env", "envs", "environment", "environments"].includes(type)) {
      return listEnvironments();
    }
    if (["tag", "tags"].includes(type)) {
      return listTags();
    }
    return listSuites();
  }
}

function listEnvironments() {
  Cli.subheader("List Environments").log("");
  if (FlagpoleExecution.config) {
    const envNames: string[] = FlagpoleExecution.config.getEnvironmentNames();
    if (envNames.length > 0) {
      return Cli.log("Found these environments:")
        .list(envNames)
        .log("")
        .exit(0);
    }
  }
  return Cli.log("Did not find any environments.").exit(2);
}

function listTags() {
  Cli.subheader("List Tags").log("");
  const tags: string[] = FlagpoleExecution.config?.getTags() || [];
  if (tags.length > 0) {
    return Cli.log("Found these tags:").list(tags).log("").exit(0);
  } else {
    return Cli.log("Did not find any tags.").exit(2);
  }
}

function listSuites() {
  if (!FlagpoleExecution.config) {
    throw "Flagpole config not found";
  }
  Cli.subheader("List Suites").log(
    `Looking in folder: ${FlagpoleExecution.config.getTestsFolder()}`,
    ""
  );
  let suiteNames: string[] = FlagpoleExecution.config.getSuiteNames();
  if (suiteNames.length > 0) {
    Cli.log("Found these test suites:").list(suiteNames).log("").exit(0);
  } else {
    Cli.log("Did not find any test suites.").exit(2);
  }
}
