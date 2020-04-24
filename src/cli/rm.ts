import {
  printSubheader,
  printHeader,
  stringArrayToPromptChoices,
  promptSelect,
  promptConfirm,
} from "./cli-helper";
import { Cli } from "./cli";
import * as prompts from "prompts";
import { SuiteConfig } from "./config";
import * as fs from "fs";

const canAdd: string[] = ["env", "suite"];

async function removeEnv() {
  printHeader();
  printSubheader("Remove Environment");

  const envs = stringArrayToPromptChoices(Cli.config.getEnvironmentNames());

  if (envs.length == 0) {
    Cli.log("");
    Cli.log("There are no environments defined in this project.");
    Cli.log("");
    Cli.exit(1);
  }

  const response = await prompts({
    type: "select",
    name: "name",
    message: "Which environment do you want to remove?",
    initial: Cli.commandArg2 || "",
    choices: envs,
    validate: function (input) {
      return /^[a-z0-9]{1,12}$/i.test(input);
    },
  });

  Cli.config.removeEnvironment(response.name);
  fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (
    err: any
  ) {
    if (err) {
      Cli.log("Error removing environment!");
      Cli.log("Failed updating config: " + Cli.config.getConfigPath());
      Cli.log("Got Error: " + err);
      Cli.log("");
      Cli.exit(1);
    }
    Cli.log("Removed environment " + response.name);
    Cli.list(["Config file updated"]);
    Cli.log("");
    Cli.exit(0);
  });
}

async function removeSuite() {
  printHeader();
  printSubheader("Remove Suite");

  const suites = stringArrayToPromptChoices(Cli.config.getSuiteNames().sort());

  if (suites.length == 0) {
    Cli.log("");
    Cli.log("There are no suites in this project.");
    Cli.log("");
    Cli.exit(1);
  }

  const responses = await prompts([
    promptSelect(
      "suite",
      "Which suite do you want to remove?",
      suites,
      true,
      Cli.commandArg2 || ""
    ),
    promptConfirm("delete", "Do you want to delete the files too?", false),
  ]);

  if (responses.suite) {
    Cli.log(`Removing ${responses.suite}...`);
    Cli.log("");

    const suite: SuiteConfig = Cli.config.suites[responses.suite];
    const suiteSourcePath = suite.getSourcePath();
    const suiteTestPath = suite.getTestPath();

    // Remove suite from flagpole.json
    Cli.config.removeSuite(responses.suite);
    fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (
      err: any
    ) {
      if (err) {
        Cli.log("Error removing suite!");
        Cli.log("Failed updating config: " + Cli.config.getConfigPath());
        Cli.log("Got Error: " + err);
        Cli.log("");
        Cli.exit(1);
      }
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

      Cli.list(thingsWeDid);
      Cli.log("");
      Cli.exit(0);
    });
  } else {
    Cli.log("No suite selected.");
  }
}

export async function rm() {
  Cli.hideBanner = true;
  if (Cli.commandArg == "env") {
    await removeEnv();
  } else {
    await removeSuite();
  }
}
