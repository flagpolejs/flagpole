import {
  printSubheader,
  printHeader,
  stringArrayToPromptChoices
} from "./cli-helper";
import { Cli } from "./cli";
import * as prompts from "prompts";

const fs = require("fs");

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
    validate: function(input) {
      return /^[a-z0-9]{1,12}$/i.test(input);
    }
  });

  Cli.config.removeEnvironment(response.name);
  fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function(
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

  const suites = stringArrayToPromptChoices(Cli.config.getSuiteNames());

  if (suites.length == 0) {
    Cli.log("");
    Cli.log("There are no suites in this project.");
    Cli.log("");
    Cli.exit(1);
  }

  const response = await prompts({
    type: "select",
    name: "name",
    message: "Which suite do you want to remove?",
    choices: suites,
    initial: Cli.commandArg2 || "",
    validate: function(input) {
      return /^[a-z0-9]{1,12}$/i.test(input);
    }
  });

  Cli.config.removeSuite(response.name);
  fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function(
    err: any
  ) {
    if (err) {
      Cli.log("Error removing suite!");
      Cli.log("Failed updating config: " + Cli.config.getConfigPath());
      Cli.log("Got Error: " + err);
      Cli.log("");
      Cli.exit(1);
    }
    Cli.log("Removed suite " + response.name);
    Cli.list([
      "Config file updated",
      "Did not delete suite file (so you can add it back if you need)"
    ]);
    Cli.log("");
    Cli.exit(0);
  });
}

export async function rm() {
  Cli.hideBanner = true;
  if (Cli.commandArg == "env") {
    await removeEnv();
  } else {
    await removeSuite();
  }
}
