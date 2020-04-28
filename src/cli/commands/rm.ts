import { Command } from "../command";
import { Cli } from "../cli";
import {
  stringArrayToPromptChoices,
  promptSelect,
  promptConfirm,
} from "../cli-helper";
import { FlagpoleExecution } from "../../flagpoleexecution";
import prompts = require("prompts");
import { SuiteConfig } from "../config";
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
    FlagpoleExecution.config?.getEnvironmentNames() || []
  );
  if (envs.length == 0) {
    Cli.log("", "There are no environments defined in this project.", "").exit(
      1
    );
  }
  const response = await prompts(
    promptSelect("name", "Which environment do you want to remove?", envs)
  );
  if (FlagpoleExecution.config) {
    FlagpoleExecution.config.removeEnvironment(response.name);
    await FlagpoleExecution.config.save();
    return Cli.log("Removed environment " + response.name)
      .list(["Config file updated"])
      .log("")
      .exit(0);
  }
  Cli.fatalError("Flagpole config not found.");
}

async function removeSuite() {
  Cli.subheader("Remove Suite");
  const suites = stringArrayToPromptChoices(
    FlagpoleExecution.config?.getSuiteNames().sort() || []
  );
  if (suites.length == 0) {
    return Cli.fatalError("There are no suites in this project.");
  }
  const responses = await prompts([
    promptSelect("suite", "Which suite do you want to remove?", suites),
    promptConfirm("delete", "Do you want to delete the files too?", false),
  ]);
  if (responses.suite && FlagpoleExecution.config) {
    Cli.log(`Removing ${responses.suite}...`, "");
    const suite: SuiteConfig = FlagpoleExecution.config.suites[responses.suite];
    const suiteSourcePath = suite.getSourcePath();
    const suiteTestPath = suite.getTestPath();
    // Remove suite from flagpole.json
    FlagpoleExecution.config.removeSuite(responses.suite);
    await FlagpoleExecution.config.save();
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
        thingsWeDid.push(`Error. Failed to delete files: ${ex.message}`);
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
