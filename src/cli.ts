#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');

// Read command line arguments
process.env.ENVIRONMENT = argv.env || 'prod';
process.env.SUITE = argv.suite || null;
process.env.GROUP = argv.group || null;
process.env.ROOT_FOLDER = (function() {
    // Default root folder
    let rootFolder: string = argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
    // Override
    if (argv.root) {
        rootFolder = argv.root;
        rootFolder = (rootFolder.match(/\/$/) ? rootFolder : rootFolder + '/') + 'tests/';
    }
    return rootFolder;
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
        this.name = dir.replace(String(process.env.ROOT_FOLDER), '') + file.split('.').slice(0, -1).join('.');
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

    return findTests(process.env.ROOT_FOLDER);

})();


/**
 *  Header branding
 *
 *  We'll write this right away
 */
console.log("\x1b[32m", "\n", `\x1b[31m$$$$$$$$\\ $$\\                                         $$\\           
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


/**
 * COMMAND LINE ARGUMENTS
 */

// List available test suites
if (argv.list) {
    log('Looking in folder: ' + process.env.ROOT_FOLDER + "\n");
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
// Run a specific test suite
else if (argv.suite) {
    let test = getTestByName(argv.suite);
    if (test) {
        runTestFile(test.filePath);
    }
    else {
        log('Could not find test suite: ' + argv.suite + "\n");
        exit(3);
    }
}
// Run all test suites
else if (argv.all) {
    // Loop through first and just add them to make sure we are tracking it (avoid race conditions)
    tests.forEach(function(test) {
        onTestStart(test.filePath);
    });
    // Now loop through again to actually run them
    tests.forEach(function(test) {
        runTestFile(test.filePath);
    });
}
