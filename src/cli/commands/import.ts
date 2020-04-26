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
  public async action() {
    if (!FlagpoleExecution.config) {
      throw "Flagpole config not found";
    }
    Cli.subheader("Import Suite");
    const suitesAvailableToImport = stringArrayToPromptChoices(
      await findDetachedSuites()
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
        FlagpoleExecution.config &&
          FlagpoleExecution.config.addSuite({
            name: suiteName,
            tags: responses.tags.split(" "),
          });
      });
      await FlagpoleExecution.config.save();
      Cli.log(`Imported Suites:`).list(responses.suitesNames).log("").exit(0);
    } else {
      Cli.log("No suites selected. Nothing imported.").log("").exit(1);
    }
  }
}
