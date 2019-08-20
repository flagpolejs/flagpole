import { Cli } from './cli';
import { SuiteConfig } from "./config";
import { TestRunner } from './testrunner';
import { CliAnsi } from './cli-ansi';

const ansi = new CliAnsi();

export const run = async (suiteNames: string[], tag: string): Promise<void> => {
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
    return runSuites(selectedSuites);
}

const runSuites = async (selectedSuites: SuiteConfig[]): Promise<void> => {
    
    // Add suites to our test runner
    const runner: TestRunner = new TestRunner();
    selectedSuites.forEach(function (suite: SuiteConfig) {
        runner.addSuite(suite);
    });

    // If no matching tests found to run
    if (runner.suites.length == 0) {
        Cli.log("Did not find any test suites to run.\n");
        Cli.exit(2);
    }

    ansi.writeLine();
    runner.subscribe((message: string) => {
        ansi.writeLine(
            ansi.cursorUp(),
            ansi.eraseLine(),
            message
        );
    });

    // Run them doggies
    await runner.run();
    ansi.write(ansi.eraseLines(2));
    Cli.exit(runner.exitCode);

}