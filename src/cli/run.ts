import { Cli } from './cli';
import { SuiteConfig } from "./config";
import { TestRunner } from './testrunner';

export function run(suiteNames: string[], tag: string) {
    const suites: SuiteConfig[] = Cli.config.getSuites();
    let selectedSuites: SuiteConfig[] = [];
    // Run only certain suites, as specified in -s 
    if (suiteNames.length) {
        suites.forEach(function (suite: SuiteConfig) {
            if (suiteNames.includes(suite.name)) {
                selectedSuites.push(suite);
            }
        });
    }
    // Run only suites with this tag, as specified by -t
    else if (tag.length) {
        suites.forEach(function (suite: SuiteConfig) {
            if (suite.tags.includes(tag)) {
                selectedSuites.push(suite);
            }
        });
    }
    // Otherwise, include all
    else {
        selectedSuites = suites;
    }
    // Now run them
    runSuites(selectedSuites);
}

function runSuites(selectedSuites: SuiteConfig[]) {
    
    // Add suites to our test runner
    const tests: TestRunner = new TestRunner();
    selectedSuites.forEach(function (suite: SuiteConfig) {
        tests.addSuite(suite);
    });

    // If no matching tests found to run
    if (tests.getSuites().length == 0) {
        Cli.log("Did not find any test suites to run.\n");
        Cli.exit(2);
    }

    // Run them doggies
    tests.run();

}