import { Cli, printSubheader, printHeader } from "./cli-helper";

export function list(suite: string[] = []) {

    Cli.hideBanner = true;

    if (Cli.commandArg == 'env') {
        printHeader();
        printSubheader('List Environments');
        Cli.log('');
        let envNames: string[] = Cli.config.getEnvironmentNames();
        if (envNames.length > 0) {
            Cli.log('Found these environments:');
            Cli.list(envNames);
            Cli.log("\n");
            Cli.exit(0);
        }
        else {
            Cli.log("Did not find any environments.\n");
            Cli.exit(2);
        }
    }
    else {
        printHeader();
        printSubheader('List Suites');
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

}