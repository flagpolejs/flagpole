import { Command } from "../command";
import { Cli } from "../cli";
import { FlagpoleExecution } from "../../flagpoleexecution";
import { findJsFilesInTestFolder } from "../cli-helper";

export default class Audit extends Command {
  public commandString = "audit";
  public description =
    "find problems in Flagpole configuration, such as suites whose files do not exist";
  public async action() {
    const suiteNames: string[] = (
      FlagpoleExecution.global.config.getSuiteNames() || []
    ).sort();
    const suitesInFolder: string[] = await findJsFilesInTestFolder();
    const suitesNotExisting = suiteNames.filter(
      (x) => !suitesInFolder.includes(x)
    );

    Cli.subheader("Audit Suites").log(
      "Looking in folder: " + FlagpoleExecution.global.config.getTestsFolder(),
      ""
    );

    if (suitesNotExisting.length > 0) {
      Cli.log("Found these test suites without matching files:")
        .list(suitesNotExisting)
        .log("")
        .exit(0);
    } else {
      Cli.log("Did not find any suites whose file did not exist.").exit(2);
    }
  }
}
