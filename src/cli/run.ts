import { Tests, Cli } from "./cli-helper";

export function run(suite: string[] = []) {

    let tests: Tests = new Tests(Cli.testsPath || process.cwd());

    // Run a specific test suites
    if (suite.length) {
        // Do all of these test suites requested actually exist?
        let notExists: string | null = tests.getAnyTestSuitesNotFound(suite)
        if (notExists !== null) {
            Cli.log('Test suite not found: ' + notExists);
            Cli.exit(1);
        }
    }

    // Apply filters
    tests.filterTestSuitesByName(suite);

    // If no matching tests found to run
    if (!tests.foundTestSuites()) {
        Cli.log("Did not find any tests to run.\n");
        Cli.exit(2);
    }

    // Run them doggies
    tests.runAll();

}