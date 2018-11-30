"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
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
class TestRunner {
    constructor() {
        this.testSuiteStatus = {};
        this.suites = [];
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
    addSuite(suite) {
        this.suites.push(suite);
    }
    reset() {
        this.suites = [];
    }
    getSuites() {
        return this.suites;
    }
    run() {
        let me = this;
        this.testSuiteStatus = {};
        this.suites.forEach(function (test) {
            me.onTestStart(test.getPath());
        });
        this.suites.forEach(function (suite) {
            me.runTestFile(suite.getPath());
        });
    }
}
exports.TestRunner = TestRunner;
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
        let config = new config_1.FlagpoleConfig();
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
            config = new config_1.FlagpoleConfig(configData);
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
