import {
  printSubheader,
  printHeader,
  stringArrayToPromptChoices
} from "./cli-helper";
import { Cli } from "./cli";
import * as prompts from "prompts";

const fs = require("fs");

export async function importSuite() {
  Cli.hideBanner = true;
  printHeader();
  printSubheader("Import Suite");

  const suitesAvailableToImport = stringArrayToPromptChoices(
    Cli.findDetachedSuites()
  );

  // If no suites available to import
  if (!suitesAvailableToImport.length) {
    Cli.log("");
    Cli.log("There were no JS files in tests folder available to import.");
    Cli.log("");
    Cli.exit(0);
  }

  const suiteToImport = await prompts([
    {
      type: "select",
      name: "name",
      message: "Which suite do you want to import?",
      choices: suitesAvailableToImport
    },
    {
      type: "list",
      name: "tags",
      message: "Add Tags (Optional)",
      initial: "",
      // @ts-ignore
      separator: " "
    }
  ]);

  Cli.config.addSuite({ name: suiteToImport.name, tags: suiteToImport.tags });
  fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function(
    err: any
  ) {
    if (err) {
      Cli.log("Error importing suite!");
      Cli.log("Failed updating config: " + Cli.config.getConfigPath());
      Cli.log("Got Error: " + err);
      Cli.log("");
      Cli.exit(1);
    }
    Cli.log("Imported Suite");
    Cli.list(["Config file updated"]);
    Cli.log("");
    Cli.exit(0);
  });
}
