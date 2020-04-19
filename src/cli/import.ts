import {
  printSubheader,
  printHeader,
  stringArrayToPromptChoices,
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

  const responses = await prompts([
    {
      type: "multiselect",
      name: "suitesNames",
      message: "Which suites do you want to import?",
      choices: suitesAvailableToImport,
    },
    {
      type: "text",
      name: "tags",
      message: "Add Tags (Optional, Space Delimited)",
      initial: "",
      validate: function (input) {
        return /^[A-Z0-9 -_]*$/i.test(input);
      },
    },
  ]);

  if (responses && responses.suitesNames && responses.suitesNames.length > 0) {
    responses.suitesNames.forEach((suiteName: string) => {
      Cli.config.addSuite({ name: suiteName, tags: responses.tags.split(" ") });
    });
    await Cli.config.save();
    Cli.log(`Imported Suites:`);
    Cli.list(responses.suitesNames);
    Cli.log("");
    Cli.exit(0);
  } else {
    Cli.log("No suites selected. Nothing imported.");
    Cli.log("");
    Cli.exit(1);
  }
}
