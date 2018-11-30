import { FlagpoleConfig, SuiteConfig } from "./config";
import { Flagpole } from "..";

const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const ansiAlign = require('ansi-align');

export function printHeader() {
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

export function printSubheader(heading: string) {
    console.log(
        ansiAlign.center(
            "\x1b[31m===========================================================================\n" + 
            "\x1b[0m" + heading + "\n" +
            "\x1b[31m===========================================================================\x1b[0m\n"
        )
    );
}

export class TestRunner {

    private testSuiteStatus: { [s: string]: number|null; } = {};
    private suites: SuiteConfig[] = [];

    constructor() {
        
    }

    private onTestStart(filePath: string) {
        this.testSuiteStatus[filePath] = null;
    };

    private onTestExit(filePath: string, exitCode: number) {
        let me: TestRunner = this;
        this.testSuiteStatus[filePath] = exitCode;
        // Are they all done?
        let areDone: boolean = Object.keys(this.testSuiteStatus).every(function(filePath: string) {
            return (me.testSuiteStatus[filePath] !== null);
        });
        let areAllPassing: boolean = Object.keys(this.testSuiteStatus).every(function(filePath: string) {
            return (me.testSuiteStatus[filePath] === 0);
        });
        if (areDone) {
            if (!areAllPassing) {
                Cli.log('Some suites failed.');
                Cli.log("\n");
            }
            Cli.exit(areAllPassing ? 0 : 1);
        }
    };

    /**
     *
     * @param {string} filePath
     */
    private runTestFile(filePath: string) {
        let me: TestRunner = this;
        this.onTestStart(filePath);

        let opts: string = '';
        if (Flagpole.environment) {
            opts += ' -e ' + Flagpole.environment;
        }

        let child = exec('node ' + filePath + opts);

        child.stdout.on('data', function(data) {
            data && Cli.log(data);
        });

        child.stderr.on('data', function(data) {
            data && Cli.log(data);
        });

        child.on('error', function(data) {
            data && Cli.log(data);
        });

        child.on('exit', function(exitCode) {
            if (exitCode > 0) {
                Cli.log('FAILED TEST SUITE:');
                Cli.log(filePath + ' exited with error code ' + exitCode);
                Cli.log("\n");
            }
            me.onTestExit(filePath, exitCode);
        });

    };

    public addSuite(suite: SuiteConfig) {
        this.suites.push(suite);
    }

    public reset() {
        this.suites = [];
    }

    public getSuites(): SuiteConfig[] {
        return this.suites;
    }

    public run() {
        let me: TestRunner = this;
        // Clear previous
        this.testSuiteStatus = {};
        // Loop through first and just add them to make sure we are tracking it (avoid race conditions)
        this.suites.forEach(function (test: SuiteConfig) {
            me.onTestStart(test.getPath());
        });
        this.suites.forEach(function(suite: SuiteConfig) {
            me.runTestFile(suite.getPath());
        });
    }

}


export class Cli {

    static consoleLog: Array<string> = [];
    static hideBanner: boolean = false;
    static rootPath: string = __dirname;
    static configPath: string = __dirname + '/flagpole.json';
    static config: FlagpoleConfig;
    static testsPath: string = __dirname + '/tests/';
    static command: string | null = null;
    static commandArg: string | null = null;

    static log(message: string) {
        if (typeof message !== 'undefined') {
            Cli.consoleLog.push(message.replace(/\n$/, ''));
        }
    }

    static list(list: Array<string>) {
        list.forEach(function(message: string) {
            Cli.log('  » ' + message);
        });
    }

    static exit(exitCode: number) {
        if (!Cli.hideBanner) {
            printHeader();
        }
        Cli.consoleLog.forEach(function(message: string) {
            console.log(message);
        });
        process.exit(exitCode);
    };

    static normalizePath(path: string): string {
        if (path) {
            path = (path.match(/\/$/) ? path : path + '/');
        }
        return path;
    }

    static parseConfigFile(configPath: string): FlagpoleConfig {
        let config: FlagpoleConfig = new FlagpoleConfig();
        // Does path exist?
        if (configPath && fs.existsSync(configPath)) {
            // Read the file
            let configContent: string = fs.readFileSync(configPath);
            let configDir: string = Cli.normalizePath(path.dirname(configPath));
            let configData: any;
            try {
                configData = JSON.parse(configContent);
            }
            catch {
                configData = {};
            }
            configData.configPath = configPath;
            configData.configDir = configDir;
            config = new FlagpoleConfig(configData);
        }
        return config;
    }
    
}