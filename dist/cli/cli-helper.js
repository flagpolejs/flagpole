"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const ansiAlign = require('ansi-align');
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
exports.printHeader = printHeader;
function printSubheader(heading) {
    console.log(ansiAlign.center("\x1b[31m===========================================================================\n" +
        "\x1b[0m" + heading + "\n" +
        "\x1b[31m===========================================================================\x1b[0m\n"));
}
exports.printSubheader = printSubheader;
class FlagpoleConfig {
    constructor(configData = {}) {
        this.env = [];
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        this.configDir = configData.configDir || process.cwd();
        this.projectName = configData.project || 'default';
        this.env = configData.env || [];
        this.testFolderName = configData.path || 'tests';
        this.testsPath = Cli.normalizePath(this.configDir + this.testFolderName);
    }
    isValid() {
        return (typeof this.projectName !== 'undefined' && this.projectName.length > 0 &&
            typeof this.testsPath !== 'undefined' && fs.existsSync(this.testsPath) &&
            this.env.length > 0);
    }
}
exports.FlagpoleConfig = FlagpoleConfig;
class TestSuiteFile {
    constructor(rootTestsDir, dir, file) {
        this.rootTestsDir = '';
        this.filePath = '';
        this.fileName = '';
        this.name = '';
        this.rootTestsDir = rootTestsDir;
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(this.rootTestsDir, '') + file.split('.').slice(0, -1).join('.');
    }
}
exports.TestSuiteFile = TestSuiteFile;
class Tests {
    constructor(testsFolder) {
        this.testSuiteStatus = {};
        this.suites = [];
        this.testsFolder = testsFolder = Cli.normalizePath(testsFolder);
        let me = this;
        this.suites = (function () {
            let tests = [];
            let findTests = function (dir, isSubFolder = false) {
                if (fs.existsSync(dir)) {
                    let files = fs.readdirSync(dir);
                    files.forEach(function (file) {
                        if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
                            tests = findTests(dir + file + '/', true);
                        }
                        else if (file.match(/.js$/)) {
                            tests.push(new TestSuiteFile(me.testsFolder, dir, file));
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
        let opts = '';
        if (Cli.environment) {
            opts += ' -e ' + Cli.environment;
        }
        let child = exec('node ' + filePath + opts);
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
        if (typeof message !== 'undefined') {
            Cli.consoleLog.push(message.replace(/\n$/, ''));
        }
    }
    static list(list) {
        list.forEach(function (message) {
            Cli.log('  » ' + message);
        });
    }
    static exit(exitCode) {
        if (!Cli.hideBanner) {
            printHeader();
        }
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
    static parseConfigFile(configPath) {
        let config = new FlagpoleConfig();
        if (configPath && fs.existsSync(configPath)) {
            let configContent = fs.readFileSync(configPath);
            let configDir = Cli.normalizePath(path.dirname(configPath));
            let configData;
            try {
                configData = JSON.parse(configContent);
            }
            catch (_a) {
                configData = {};
            }
            configData.configPath = configPath;
            configData.configDir = configDir;
            config = new FlagpoleConfig(configData);
        }
        return config;
    }
}
Cli.consoleLog = [];
Cli.hideBanner = false;
Cli.rootPath = __dirname;
Cli.configPath = __dirname + '/flagpole.json';
Cli.testsPath = __dirname + '/tests/';
Cli.environment = 'dev';
Cli.command = null;
Cli.commandArg = null;
exports.Cli = Cli;
