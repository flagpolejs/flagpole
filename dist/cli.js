#!/usr/bin/env node
'use strict';
let exec = require('child_process').exec;
let fs = require('fs');
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
    .default('p', function () {
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
process.env.COMMAND = argv._[0];
if (['run', 'list'].indexOf(String(process.env.COMMAND)) < 0) {
    printHeader();
    console.log("Command must be either: run, list\n");
    console.log("Example: flagpole run\n");
    process.exit(1);
}
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
}
;
process.env.TESTS_FOLDER = (function () {
    let path = argv.p;
    let group = (typeof argv.g !== 'undefined') ? (argv.g.match(/\/$/) ? argv.g : argv.g + '/') : '';
    path = (path.match(/\/$/) ? path : path + '/');
    return path + group;
})();
let testSuiteStatus = {};
let onTestStart = function (filePath) {
    testSuiteStatus[filePath] = null;
};
let onTestExit = function (filePath, exitCode) {
    testSuiteStatus[filePath] = exitCode;
    let areDone = Object.keys(testSuiteStatus).every(function (filePath) {
        return (testSuiteStatus[filePath] !== null);
    });
    let areAllPassing = Object.keys(testSuiteStatus).every(function (filePath) {
        return (testSuiteStatus[filePath] === 0);
    });
    if (areDone) {
        if (!areAllPassing) {
            log('Some suites failed.');
            log("\n");
        }
        exit(areAllPassing ? 0 : 1);
    }
};
let consoleLog = [];
let log = function (message) {
    consoleLog.push(message);
};
let exit = function (exitCode) {
    consoleLog.forEach(function (message) {
        console.log(message.trim());
    });
    process.exit(exitCode);
};
class TestSuiteFile {
    constructor(dir, file) {
        this.filePath = '';
        this.fileName = '';
        this.name = '';
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(String(process.env.TESTS_FOLDER), '') + file.split('.').slice(0, -1).join('.');
    }
}
let runTestFile = function (filePath) {
    onTestStart(filePath);
    let child = exec('node ' + filePath);
    child.stdout.on('data', function (data) {
        data && log(data);
    });
    child.stderr.on('data', function (data) {
        data && log(data);
    });
    child.on('error', function (data) {
        data && log(data);
    });
    child.on('exit', function (exitCode) {
        if (exitCode > 0) {
            log('FAILED TEST SUITE:');
            log(filePath + ' exited with error code ' + exitCode);
            log("\n");
        }
        onTestExit(filePath, exitCode);
    });
};
let getTestByName = function (name) {
    for (let i = 0; i < tests.length; i++) {
        if (tests[i].name == name) {
            return tests[i];
        }
    }
};
let tests = (function () {
    let tests = [];
    let findTests = function (dir) {
        if (fs.existsSync(dir)) {
            let files = fs.readdirSync(dir);
            files.forEach(function (file) {
                if (fs.statSync(dir + file).isDirectory()) {
                    tests = findTests(dir + file + '/');
                }
                else if (file.match(/.js$/)) {
                    tests.push(new TestSuiteFile(dir, file));
                }
            });
        }
        return tests;
    };
    return findTests(process.env.TESTS_FOLDER);
})();
if (process.env.COMMAND == 'list') {
    printHeader();
    log('Looking in folder: ' + process.env.TESTS_FOLDER + "\n");
    if (tests.length > 0) {
        log('Found these test suites:');
        tests.forEach(function (test) {
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
else if (process.env.COMMAND == 'run') {
    printHeader();
    if (argv.suite) {
        let testSuites = [];
        argv.suite.forEach(function (suiteName) {
            let testSuite = getTestByName(suiteName);
            if (testSuite) {
                testSuites.push(testSuite);
            }
            else {
                log('Could not find test suite: ' + suiteName + "\n");
                exit(3);
            }
        });
        testSuites.forEach(function (testSuite) {
            runTestFile(testSuite.filePath);
        });
    }
    else {
        tests.forEach(function (test) {
            onTestStart(test.filePath);
        });
        tests.forEach(function (test) {
            runTestFile(test.filePath);
        });
    }
}
