import { Cli } from './cli';
import { SuiteConfig } from "./config";
import { TestRunner } from './testrunner';
import { CliAnsi } from './cli-ansi';
import { Flagpole, FlagpoleOutput } from '..';

const ansi = new CliAnsi();

export const run = async (suiteNames: string[], tag: string): Promise<void> => {
    const suitesInProject: SuiteConfig[] = Cli.config.getSuites();
    let selectedSuites: SuiteConfig[] = [];
    // Run only certain suites, as specified in -s 
    if (suiteNames.length) {
        // Support wildcards and make case insensitive
        // They can use * and ?
        let regEx: RegExp = (function () {
            let arr: string[] = [];
            suiteNames.forEach((name) => {
                // Convert string to regex-ready string
                arr.push(
                    name
                        .replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1")
                        .replace('*', '.*')
                );
            });
            return new RegExp(`^${arr.join('|')}$`, 'i');
        })();
        // Find matching suites
        suitesInProject.forEach(function (suite: SuiteConfig) {
            if (regEx.test(suite.name)) {
                selectedSuites.push(suite);
            }
        });
    }
    // Run only suites with this tag, as specified by -t
    else if (tag.length) {
        suitesInProject.forEach(function (suite: SuiteConfig) {
            if (suite.tags.includes(tag)) {
                selectedSuites.push(suite);
            }
        });
    }
    // Otherwise, include all
    else {
        selectedSuites = suitesInProject;
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

    // If console output, then give feedback
    if (Flagpole.executionOpts.output == FlagpoleOutput.console) {
        // If no matching tests found to run
        if (runner.suites.length == 0) {
            Cli.log("Did not find any test suites to run.\n");
            Cli.exit(2);
        }

        ansi.writeLine();

        const states = ['/', '—', '\\', '|'];
        let stateIndex: number = 0;
        let statusMessage: string = `Loading ${runner.suites.length} test suites...`;
        let timer = setInterval(() => {
            ansi.writeLine(
                ansi.cursorUp(),
                ansi.eraseLine(),
                `${states[stateIndex]} ${statusMessage}`
            );
            stateIndex = (stateIndex < states.length - 1) ? stateIndex + 1 : 0;
        }, 100);
        

        runner.subscribe((message: string) => {
            statusMessage = message;
        });

        await runner.runSpawn();
        clearInterval(timer);
        ansi.write(ansi.eraseLines(2));
    }
    // If other output, just give final out
    else {
        await runner.runSpawn();
    }

    // Adios
    Cli.exit(runner.exitCode);

}