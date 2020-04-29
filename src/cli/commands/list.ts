import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";

export default class List extends Command {
  public commandString = "list [type]";
  public description =
    "list out the suites, environments or tags in this project";
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
  const envNames: string[] = FlagpoleExecution.global.config.getEnvironmentNames();
  if (envNames.length > 0) {
    return Cli.log("Found these environments:").list(envNames).log("").exit(0);
  }
  return Cli.log("Did not find any environments.").exit(2);
}

function listTags() {
  Cli.subheader("List Tags").log("");
  const tags: string[] = FlagpoleExecution.global.config.getTags() || [];
  if (tags.length > 0) {
    return Cli.log("Found these tags:").list(tags).log("").exit(0);
  } else {
    return Cli.log("Did not find any tags.").exit(2);
  }
}

function listSuites() {
  Cli.subheader("List Suites").log(
    `Looking in folder: ${FlagpoleExecution.global.config.getTestsFolder()}`,
    ""
  );
  let suiteNames: string[] = FlagpoleExecution.global.config.getSuiteNames();
  if (suiteNames.length > 0) {
    Cli.log("Found these test suites:").list(suiteNames).log("").exit(0);
  } else {
    Cli.log("Did not find any test suites.").exit(2);
  }
}
