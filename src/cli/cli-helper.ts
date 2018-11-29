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

export class FlagpoleConfig {

    public configPath: string;
    public configDir: string;
    public testsPath: string|undefined;
    public env: string[] = [];
    public projectName: string;
    public testFolderName: string;
    
    constructor(configData: any = {}) {
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        this.configDir = configData.configDir || process.cwd();
        this.projectName = configData.project || 'default';
        this.env = configData.env || [];
        this.testFolderName = configData.path || 'tests';
        this.testsPath = Cli.normalizePath(this.configDir + this.testFolderName);
    }

    public isValid(): boolean {
        return (
            typeof this.projectName !== 'undefined' && this.projectName.length > 0 &&
            typeof this.testsPath !== 'undefined' && fs.existsSync(this.testsPath) &&
            this.env.length > 0
        );
    }

}

export class TestSuiteFile {

    public rootTestsDir: string = '';
    public filePath: string = '';
    public fileName: string = '';
    public name: string = '';

    constructor(rootTestsDir: string, dir: string, file: string) {
        this.rootTestsDir = rootTestsDir;
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(this.rootTestsDir, '') + file.split('.').slice(0, -1).join('.');
    }

}

export class Tests {

    private testsFolder: string;
    private testSuiteStatus: { [s: string]: number|null; } = {};
    private suites: Array<TestSuiteFile> = [];

    constructor(testsFolder: string) {

        this.testsFolder = testsFolder = Cli.normalizePath(testsFolder);

        // Discover all test suites in the specified folder
        let me: Tests = this;
        this.suites = (function(): Array<TestSuiteFile> {

            let tests: Array<TestSuiteFile> = [];

            let findTests = function(dir: string, isSubFolder: boolean = false) {
                // Does this folder exist?
                if (fs.existsSync(dir)) {
                    // Read contents
                    let files = fs.readdirSync(dir);
                    files.forEach(function(file) {
                        // Drill into sub-folders, but only once!
                        if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
                            tests = findTests(dir + file + '/', true);
                        }
                        // Push in any JS files
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

    private onTestStart(filePath: string) {
        this.testSuiteStatus[filePath] = null;
    };

    private onTestExit(filePath: string, exitCode: number) {
        let me: Tests = this;
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
     * Find a test with this name in our list of available tests
     *
     * @param name: string
     * @returns {TestSuiteFile}
     */
    private getTestByName(name: string) {
        for (let i=0; i < this.suites.length; i++) {
            if (this.suites[i].name == name) {
                return this.suites[i];
            }
        }
    };

    /**
     *
     * @param {string} filePath
     */
    private runTestFile(filePath: string) {
        let me: Tests = this;
        this.onTestStart(filePath);

        let child = exec('node ' + filePath);

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

    public foundTestSuites(): boolean {
        return (this.suites.length > 0);
    }

    public getSuiteNames(): Array<string> {
        let list: Array<string> = [];
        this.suites.forEach(function(test: TestSuiteFile) {
            list.push(test.name);
        });
        return list;
    }

    public getTestsFolder(): string {
        return this.testsFolder;
    }

    public runAll() {
        let me: Tests = this;
        // Loop through first and just add them to make sure we are tracking it (avoid race conditions)
        this.suites.forEach(function(test) {
            me.onTestStart(test.filePath);
        });
        this.suites.forEach(function(suite: TestSuiteFile) {
            me.runTestFile(suite.filePath);
        });
    }

    public getAnyTestSuitesNotFound(suiteNames: Array<string>): string|null {
        let suiteThatDoesNotExist: string|null = null;
        let me: Tests = this;
        suiteNames.every(function(suiteName) {
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

    public filterTestSuitesByName(suiteNames: Array<string>) {
        // If filtered list was passed in, apply filter
        if (suiteNames.length > 0) {
            // First get all test suites that we found or error
            let filteredSuites: Array<TestSuiteFile> = [];
            let me: Tests = this;
            suiteNames.forEach(function(suiteName) {
                let testSuite: TestSuiteFile|undefined = me.getTestByName(suiteName);
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


export class Cli {

    static consoleLog: Array<string> = [];
    static hideBanner: boolean = false;
    static rootPath: string = __dirname;
    static configPath: string = __dirname + '/flagpole.json';
    static config: FlagpoleConfig;
    static testsPath: string = __dirname + '/tests/';
    static environment: string = 'dev';
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