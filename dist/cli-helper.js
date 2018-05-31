"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let fs = require('fs');
let exec = require('child_process').exec;
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
exports.TestSuiteFile = TestSuiteFile;
class Tests {
    constructor(testsFolder) {
        this.testSuiteStatus = {};
        this.suites = [];
        this.testsFolder = testsFolder = Cli.normalizePath(testsFolder);
        this.suites = (function () {
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
            return findTests(testsFolder);
        })();
    }
    onTestStart(filePath) {
        this.testSuiteStatus[filePath] = null;
    }
    ;
    onTestExit(filePath, exitCode) {
        let me = this;
        this.testSuiteStatus[filePath] = exitCode;
        let areDone = Object.keys(this.testSuiteStatus).every(function (filePath) {
            return (me.testSuiteStatus[filePath] !== null);
        });
        let areAllPassing = Object.keys(this.testSuiteStatus).every(function (filePath) {
            return (me.testSuiteStatus[filePath] === 0);
        });
        if (areDone) {
            if (!areAllPassing) {
                Cli.log('Some suites failed.');
                Cli.log("\n");
            }
            Cli.exit(areAllPassing ? 0 : 1);
        }
    }
    ;
    getTestByName(name) {
        for (let i = 0; i < this.suites.length; i++) {
            if (this.suites[i].name == name) {
                return this.suites[i];
            }
        }
    }
    ;
    runTestFile(filePath) {
        let me = this;
        this.onTestStart(filePath);
        let child = exec('node ' + filePath);
        child.stdout.on('data', function (data) {
            data && Cli.log(data);
        });
        child.stderr.on('data', function (data) {
            data && Cli.log(data);
        });
        child.on('error', function (data) {
            data && Cli.log(data);
        });
        child.on('exit', function (exitCode) {
            if (exitCode > 0) {
                Cli.log('FAILED TEST SUITE:');
                Cli.log(filePath + ' exited with error code ' + exitCode);
                Cli.log("\n");
            }
            me.onTestExit(filePath, exitCode);
        });
    }
    ;
    foundTestSuites() {
        return (this.suites.length > 0);
    }
    getSuiteNames() {
        let list = [];
        this.suites.forEach(function (test) {
            list.push(test.name);
        });
        return list;
    }
    getTestsFolder() {
        return this.testsFolder;
    }
    runAll() {
        let me = this;
        this.suites.forEach(function (test) {
            me.onTestStart(test.filePath);
        });
        this.suites.forEach(function (suite) {
            me.runTestFile(suite.filePath);
        });
    }
    getAnyTestSuitesNotFound(suiteNames) {
        let suiteThatDoesNotExist = null;
        let me = this;
        suiteNames.every(function (suiteName) {
            if (typeof me.getTestByName(suiteName) !== 'undefined') {
                return true;
            }
            else {
                suiteThatDoesNotExist = suiteName;
                return false;
            }
        });
        return suiteThatDoesNotExist;
    }
    filterTestSuitesByName(suiteNames) {
        if (suiteNames.length > 0) {
            let filteredSuites = [];
            let me = this;
            suiteNames.forEach(function (suiteName) {
                let testSuite = me.getTestByName(suiteName);
                if (testSuite) {
                    filteredSuites.push(testSuite);
                }
                else {
                    Cli.log('Could not find test suite: ' + suiteName + "\n");
                    Cli.exit(3);
                }
            });
            me.suites = filteredSuites;
        }
    }
}
exports.Tests = Tests;
class Cli {
    static log(message) {
        Cli.consoleLog.push(message.replace(/\n$/, ''));
    }
    static list(list) {
        list.forEach(function (message) {
            Cli.log('  » ' + message);
        });
    }
    static exit(exitCode) {
        printHeader();
        Cli.consoleLog.forEach(function (message) {
            console.log(message);
        });
        process.exit(exitCode);
    }
    ;
    static normalizePath(path) {
        if (path) {
            path = (path.match(/\/$/) ? path : path + '/');
        }
        return path;
    }
}
Cli.consoleLog = [];
exports.Cli = Cli;
