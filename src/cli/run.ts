import { Cli } from './cli';
import { SuiteConfig } from "./config";
import { TestRunner } from './testrunner';

export function run(selectedSuites: string[] = []) {

    let tests: TestRunner = new TestRunner();
    let suites: SuiteConfig[] = Cli.config.getSuites();

    // Run only certain suites
    if (selectedSuites.length) {
        suites.forEach(function (suite: SuiteConfig) {
            if (selectedSuites.includes(suite.name)) {
                tests.addSuite(suite);
            }
        });
    }
    // Run all tests
    else {
        suites.forEach(function (suite: SuiteConfig) {
            tests.addSuite(suite);
        });
    }

    // If no matching tests found to run
    if (tests.getSuites().length == 0) {
        Cli.log("Did not find any test suites to run.\n");
        Cli.exit(2);
    }

    // Run them doggies
    tests.run();

}