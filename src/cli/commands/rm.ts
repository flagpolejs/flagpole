import { Command } from "../command";
import { Cli } from "../cli";
import {
  stringArrayToPromptChoices,
  promptSelect,
  promptConfirm,
} from "../cli-helper";
import { FlagpoleExecution } from "../../flagpoleexecution";
import prompts = require("prompts");
import { SuiteConfig } from "../../flagpoleconfig";
import * as fs from "fs-extra";

export default class Rm extends Command {
  public commandString = "rm [type]";
  public description = "remove a suite or environment";
  public async action(type: string) {
    if (type == "env") {
      await removeEnv();
    } else {
      await removeSuite();
    }
  }
}

async function removeEnv() {
  Cli.subheader("Remove Environment");
  const envs = stringArrayToPromptChoices(
    FlagpoleExecution.global.config.getEnvironmentNames() || []
  );
  if (envs.length == 0) {
    Cli.log("", "There are no environments defined in this project.", "").exit(
      1
    );
  }
  const response = await prompts(
    promptSelect("name", "Which environment do you want to remove?", envs)
  );
  FlagpoleExecution.global.config.removeEnvironment(response.name);
  await FlagpoleExecution.global.config.save();
  return Cli.log("Removed environment " + response.name)
    .list(["Config file updated"])
    .log("")
    .exit(0);
}

async function removeSuite() {
  Cli.subheader("Remove Suite");
  const suites = stringArrayToPromptChoices(
    FlagpoleExecution.global.config.getSuiteNames().sort() || []
  );
  if (suites.length == 0) {
    return Cli.fatalError("There are no suites in this project.");
  }
  const responses = await prompts([
    promptSelect("suite", "Which suite do you want to remove?", suites),
    promptConfirm("delete", "Do you want to delete the files too?", false),
  ]);
  if (responses.suite) {
    Cli.log(`Removing ${responses.suite}...`, "");
    const suite: SuiteConfig =
      FlagpoleExecution.global.config.suites[responses.suite];
    const suiteSourcePath = suite.getSourcePath();
    const suiteTestPath = suite.getTestPath();
    // Remove suite from flagpole.json
    FlagpoleExecution.global.config.removeSuite(responses.suite);
    await FlagpoleExecution.global.config.save();
    const thingsWeDid: string[] = [
      `Removed suite ${responses.suite} from config file`,
    ];
    // Wants to delete files too?
    if (responses.delete) {
      try {
        if (suiteSourcePath) {
          if (fs.existsSync(suiteSourcePath)) {
            fs.unlinkSync(suiteSourcePath);
            thingsWeDid.push(`Deleted source file: ${suiteSourcePath}`);
          } else {
            thingsWeDid.push(
              `Could not delete source file. Not found at: ${suiteSourcePath}`
            );
          }
        }
        if (suiteTestPath) {
          if (fs.existsSync(suiteTestPath)) {
            fs.unlinkSync(suiteTestPath);
            thingsWeDid.push(`Deleted test file: ${suiteTestPath}`);
          } else {
            thingsWeDid.push(
              `Could not delete test file. Not found at: ${suiteTestPath}`
            );
          }
        }
      } catch (ex) {
        thingsWeDid.push(`Error. Failed to delete files: ${String(ex)}`);
      }
    } else {
      thingsWeDid.push(
        "Did not delete suite file (so you can add it back if you need)"
      );
    }
    Cli.list(thingsWeDid).log("").exit(0);
  } else {
    Cli.log("No suite selected.").exit(1);
  }
}
