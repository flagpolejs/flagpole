import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";
import {
  findDetachedSuites,
  stringArrayToPromptChoices,
  promptMultiSelect,
  promptList,
} from "../cli-helper";
import prompts = require("prompts");

export default class Import extends Command {
  public commandString = "import";
  public description =
    "find files in the tests folder that are not in Flagpole config and import them";
  public async action() {
    Cli.subheader("Import Suite");
    const suitesAvailableToImport = stringArrayToPromptChoices(
      findDetachedSuites()
    );
    // If no suites available to import
    if (!suitesAvailableToImport.length) {
      Cli.log(
        "",
        "There were no JS files in tests folder available to import.",
        ""
      ).exit(0);
    }
    // Found suites, so continue
    const responses = await prompts([
      promptMultiSelect(
        "suitesNames",
        "Which suites do you want to import?",
        suitesAvailableToImport
      ),
      promptList("tags", "Add Tags (Optional, Space Delimited)"),
    ]);
    if (
      responses &&
      responses.suitesNames &&
      responses.suitesNames.length > 0
    ) {
      responses.suitesNames.forEach((suiteName: string) => {
        FlagpoleExecution.global.config &&
          FlagpoleExecution.global.config.addSuite({
            name: suiteName,
            tags: responses.tags,
          });
      });
      await FlagpoleExecution.global.config.save();
      Cli.log(`Imported Suites:`).list(responses.suitesNames).log("").exit(0);
    } else {
      Cli.log("No suites selected. Nothing imported.").log("").exit(1);
    }
  }
}
