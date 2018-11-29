import { Tests, Cli } from "./cli-helper";

export function list(suite: string[] = []) {

    let tests: Tests = new Tests(Cli.testsPath || process.cwd());

    Cli.log('Looking in folder: ' + tests.getTestsFolder());
    Cli.log('');
    if (tests.foundTestSuites()) {
        Cli.log('Found these test suites:');
        Cli.list(tests.getSuiteNames());
        Cli.log("\n");
        Cli.exit(0);
    }
    else {
        Cli.log("Did not find any tests.\n");
        Cli.exit(2);
    }

}