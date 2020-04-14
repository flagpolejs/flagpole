import { printSubheader, printHeader } from "./cli-helper";
import { Cli } from "./cli";

export function audit(suite: string[] = []) {
  Cli.hideBanner = true;

  const suiteNames: string[] = Cli.config.getSuiteNames();
  const suitesInFolder: string[] = Cli.findJsFilesInTestFolder();
  const suitesNotExisting = suiteNames.filter(
    (x) => !suitesInFolder.includes(x)
  );

  printHeader();
  printSubheader("Audit Suites");
  Cli.log("Looking in folder: " + Cli.config.getTestsFolder());
  Cli.log("");

  if (suitesNotExisting.length > 0) {
    Cli.log("Found these test suites without matching files:");
    Cli.list(suitesNotExisting);
    Cli.log("\n");
    Cli.exit(0);
  } else {
    Cli.log("Did not find any suites whose file did not exist.\n");
    Cli.exit(2);
  }
}
