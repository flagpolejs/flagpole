import { Cli } from "./cli-helper";

export function list(suite: string[] = []) {

    Cli.log('Looking in folder: ' + Cli.config.getTestsFolder());
    Cli.log('');
    let suiteNames: string[] = Cli.config.getSuiteNames();
    if (suiteNames.length > 0) {
        Cli.log('Found these test suites:');
        Cli.list(suiteNames);
        Cli.log("\n");
        Cli.exit(0);
    }
    else {
        Cli.log("Did not find any test suites.\n");
        Cli.exit(2);
    }

}