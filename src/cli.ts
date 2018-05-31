#!/usr/bin/env node
'use strict';
let exec = require('child_process').exec;
let fs = require('fs');

/**
 * COMMAND LINE ARGUMENTS
 */
let yargs = require('yargs');
let argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .help(false)
    .version(false)
    .demandCommand(1, 'You must specify a command: list, run')
    .alias({
        's': 'suite',
        'g': 'group',
        'p': 'path',
        'e': 'env'
    })
    .describe({
        'g': 'Filter only a group of test suites in this subfolder',
        's': 'Specify one or more suites to run',
        'p': 'Specify the folder to look for tests within',
        'e': 'Environment like: dev, staging, prod'
    })
    .array('s')
    .string('g')
    .string('p')
    .string('e')
    .conflicts('g', 's')
    .default('p', function() {
        return process.cwd() + '/tests';
    }, '(current)')
    .example('flagpole list', 'To show a list of test suites')
    .example('flagpole run', 'To run all test suites')
    .example('flagpole run -s smoke', 'To run just the suite called smoke')
    .example('flagpole run -s smoke api', 'Or you can run multiple suites (smoke and api)')
    .example('flagpole run -g basic', 'To run all test suites in the basic group')
    .epilogue('For more information, go to https://github.com/flocasts/flagpole')
    .wrap(Math.min(100, yargs.terminalWidth()))
    .fail(function (msg, err, yargs) {
        printHeader();
        console.log(yargs.help());
        console.log(msg);
        process.exit(1);
    })
    .argv;

// Enforce limited list of commands
process.env.COMMAND = argv._[0];
if (['run', 'list'].indexOf(String(process.env.COMMAND)) < 0) {
    printHeader();
    console.log("Command must be either: run, list\n");
    console.log("Example: flagpole run\n");
    process.exit(1);
}

/**
 *  Header branding
 *
 *  We'll write this right away
 */
function printHeader() {
    console.log("\x1b[32m", "\n", `    \x1b[31m$$$$$$$$\\ $$\\                                         $$\\           
    \x1b[31m $$  _____|$$ |                                        $$ |          
    \x1b[31m $$ |      $$ | $$$$$$\\   $$$$$$\\   $$$$$$\\   $$$$$$\\  $$ | $$$$$$\\  
    \x1b[31m $$$$$\\    $$ | \\____$$\\ $$  __$$\\ $$  __$$\\ $$  __$$\\ $$ |$$  __$$\\ 
    \x1b[37m $$  __|   $$ | $$$$$$$ |$$ /  $$ |$$ /  $$ |$$ /  $$ |$$ |$$$$$$$$ |
    \x1b[37m $$ |      $$ |$$  __$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|
    \x1b[37m $$ |      $$ |\\$$$$$$$ |\\$$$$$$$ |$$$$$$$  |\\$$$$$$  |$$ |\\$$$$$$$\\ 
    \x1b[34m \\__|      \\__| \\_______| \\____$$ |$$  ____/  \\______/ \\__| \\_______|
    \x1b[34m                         $$\\   $$ |$$ |                              
    \x1b[34m                         \\$$$$$$  |$$ |                              
    \x1b[34m                          \\______/ \\__|`, "\x1b[0m", "\n");
};


/**
 * Read tests folder from here
 */
process.env.TESTS_FOLDER = (function() {
    // Get command line args
    let path: string = argv.p;
    let group: string = (typeof argv.g !== 'undefined') ? (argv.g.match(/\/$/) ? argv.g : argv.g + '/') : '';
    // Make sure path has trailing slashes
    path = (path.match(/\/$/) ? path : path + '/');
    // Now build our output
    return path + group;
})();

/**
 * Keep track of the test suites that ran and their exit code
 */
let testSuiteStatus: { [s: string]: number|null; } = {};
let onTestStart = function(filePath: string) {
    testSuiteStatus[filePath] = null;
};
let onTestExit = function(filePath: string, exitCode: number) {
    testSuiteStatus[filePath] = exitCode;
    // Are they all done?
    let areDone: boolean = Object.keys(testSuiteStatus).every(function(filePath: string) {
        return (testSuiteStatus[filePath] !== null);
    });
    let areAllPassing: boolean = Object.keys(testSuiteStatus).every(function(filePath: string) {
        return (testSuiteStatus[filePath] === 0);
    });
    if (areDone) {
        if (!areAllPassing) {
            log('Some suites failed.');
            log("\n");
        }
        exit(
            areAllPassing ? 0 : 1
        );
    }
};

/**
 * Buffer for console
 */
let consoleLog: Array<string> = [];
let log = function(message: string) {
    consoleLog.push(message);
};

/**
 * Exit
 */
let exit = function(exitCode: number) {
    consoleLog.forEach(function(message: string) {
        console.log(message.trim());
    });
    process.exit(exitCode);
};

/**
 * Will hold a suite file that we find in the specified folder
 */
class TestSuiteFile {

    public filePath: string = '';
    public fileName: string = '';
    public name: string = '';

    constructor(dir: string, file: string) {
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(String(process.env.TESTS_FOLDER), '') + file.split('.').slice(0, -1).join('.');
    }

}

/**
 * Execute a test
 *
 * @param filePath: string
 */
let runTestFile = function(filePath: string) {

    onTestStart(filePath);

    let child = exec('node ' + filePath);

    child.stdout.on('data', function(data) {
        data && log(data);
    });

    child.stderr.on('data', function(data) {
        data && log(data);
    });

    child.on('error', function(data) {
        data && log(data);
    });

    child.on('exit', function(exitCode) {
        if (exitCode > 0) {
            log('FAILED TEST SUITE:');
            log(filePath + ' exited with error code ' + exitCode);
            log("\n");
        }
        onTestExit(filePath, exitCode);
    });
    
};

/**
 * Find a test with this name in our list of available tests
 *
 * @param name: string
 * @returns {TestSuiteFile}
 */
let getTestByName = function(name: string) {
    for (let i=0; i < tests.length; i++) {
        if (tests[i].name == name) {
            return tests[i];
        }
    }
};

/**
 * Get all of the tests available
 *
 * @type {Array<TestSuiteFile>}
 */
let tests = (function(): Array<TestSuiteFile> {

    let tests: Array<TestSuiteFile> = [];

    let findTests = function(dir) {
        // Does this folder exist?
        if (fs.existsSync(dir)) {
            // Read contents
            let files = fs.readdirSync(dir);
            files.forEach(function(file) {
                if (fs.statSync(dir + file).isDirectory()) {
                    tests = findTests(dir + file + '/');
                }
                // Push in any JS files, but without the extension
                else if (file.match(/.js$/)) {
                    tests.push(new TestSuiteFile(dir, file));
                }
            });
        }

        return tests;
    };

    return findTests(process.env.TESTS_FOLDER);

})();




/**
 * LIST TEST SUITES
 */
if (process.env.COMMAND == 'list') {
    printHeader();
    log('Looking in folder: ' + process.env.TESTS_FOLDER + "\n");
    if (tests.length > 0) {
        log('Found these test suites:');
        tests.forEach(function(test) {
            log('  » ' + test.name);
        });
        log("\n");
        exit(0);
    }
    else {
        log("Did not find any tests.\n");
        exit(2);
    }
}
/**
 * RUN TEST SUITES
 */
else if (process.env.COMMAND == 'run') {
    printHeader();
    // Run a specific test suites
    if (argv.suite) {
        // First get all test suites that we found or error
        let testSuites: Array<TestSuiteFile> = [];
        argv.suite.forEach(function(suiteName) {
            let testSuite: TestSuiteFile|undefined = getTestByName(suiteName);
            if (testSuite) {
                testSuites.push(testSuite);
            }
            else {
                log('Could not find test suite: ' + suiteName + "\n");
                exit(3);
            }
        });
        // Now loop through those suites
        testSuites.forEach(function(testSuite: TestSuiteFile) {
            runTestFile(testSuite.filePath);
        });
    }
    // Run all matching test suites
    else {
        // Loop through first and just add them to make sure we are tracking it (avoid race conditions)
        tests.forEach(function(test) {
            onTestStart(test.filePath);
        });
        // Now loop through again to actually run them
        tests.forEach(function(test) {
            runTestFile(test.filePath);
        });
    }
}

