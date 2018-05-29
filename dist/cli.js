#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');
process.env.ENVIRONMENT = argv.env || 'prod';
process.env.SUITE = argv.suite || null;
process.env.GROUP = argv.group || null;
process.env.ROOT_FOLDER = (function () {
    let rootFolder = argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
    if (argv.root) {
        rootFolder = argv.root;
        rootFolder = (rootFolder.match(/\/$/) ? rootFolder : rootFolder + '/') + 'tests/';
    }
    return rootFolder;
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
        this.name = dir.replace(String(process.env.ROOT_FOLDER), '') + file.split('.').slice(0, -1).join('.');
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
    return findTests(process.env.ROOT_FOLDER);
})();
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
if (argv.list) {
    log('Looking in folder: ' + process.env.ROOT_FOLDER + "\n");
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
else if (argv.all) {
    tests.forEach(function (test) {
        onTestStart(test.filePath);
    });
    tests.forEach(function (test) {
        runTestFile(test.filePath);
    });
}
