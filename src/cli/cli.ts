import { FlagpoleConfig, SuiteConfig } from "./config";
import { ClorthoService, iCredentials } from 'clortho-lite';
import { printHeader } from './cli-helper';
import { toType, normalizePath } from '../util';

const fs = require('fs');
const path = require('path');

export interface iSuiteOpts {
    suiteName: string,
    baseDomain: string | { [env: string]: string },
    suiteDescription: string,
    scenarioDescription: string,
    scenarioType: string,
    scenarioPath: string
}

export interface iInitOpts {
    projectName: string,
    testsPath: string,
    environments: string[]
}

export class Cli {

    static consoleLog: string[] = [];
    static hideBanner: boolean = false;
    static rootPath: string = __dirname;
    static configPath: string = __dirname + '/flagpole.json';
    static config: FlagpoleConfig;
    static command: string | null = null;
    static commandArg: string | null = null;
    static commandArg2: string | null = null;
    static apiDomain: string = 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net'

    static isInitialized(): boolean {
        return (
            Cli.configPath && fs.existsSync(Cli.configPath) &&
            Cli.config && Cli.config.isValid()
        );
    }

    static log(message: string) {
        if (typeof message !== 'undefined') {
            Cli.consoleLog.push(message.replace(/\n$/, ''));
        }
    }

    static list(list: Array<string>) {
        list.forEach(function (message: string) {
            Cli.log('  » ' + message);
        });
    }

    static exit(exitCode: number) {
        if (!Cli.hideBanner) {
            printHeader();
        }
        Cli.consoleLog.forEach(function (message: string) {
            console.log(message);
        });
        process.exit(exitCode);
    };

    static refreshConfig(): FlagpoleConfig {
        if (Cli.configPath && fs.existsSync(Cli.configPath)) {
            // Read the file
            let configContent: string = fs.readFileSync(Cli.configPath);
            let configDir: string = normalizePath(path.dirname(Cli.configPath));
            let configData: any;
            try {
                configData = JSON.parse(configContent);
            }
            catch {
                configData = {};
            }
            configData.configDir = configDir;
            Cli.config = new FlagpoleConfig(configData);
        }
        else {
            Cli.config = new FlagpoleConfig()
        }
        Cli.config.onSave(Cli.refreshConfig);
        return Cli.config;
    }

    static parseConfigFile(configPath: string): FlagpoleConfig {
        Cli.configPath = configPath;
        return Cli.refreshConfig();
    }

    static getCredentials(): Promise<{ email: string, token: string }> {
        const serviceName: string = 'Flagpole JS';
        const service: ClorthoService = new ClorthoService(serviceName);
        let token: string;
        let email: string;
        return new Promise((resolve, reject) => {
            Promise.all([
                new Promise((resolve, reject) => {
                    service.get('token')
                        .then(function (credentials: iCredentials) {
                            token = credentials.password;
                            resolve();
                        }).catch(function () {
                            reject('No saved token.');
                        })
                }),
                new Promise((resolve, reject) => {
                    service.get('email')
                        .then(function (credentials: iCredentials) {
                            email = credentials.password;
                            resolve();
                        }).catch(function () {
                            reject('No saved email.');
                        })
                })
            ]).then(function () {
                resolve({
                    email: email,
                    token: token
                });
            }).catch(function (err) {
                reject('Not logged in. ' + err);
            });
        });
    }

    static findJsFilesInTestFolder(): string[] {

        let startFolder: string = Cli.config.getTestsFolder();
        let suitesInFolder: string[] = [];

        function findSuites(dir: string, isSubFolder: boolean = false) {
            // Does this folder exist?
            if (fs.existsSync(dir)) {
                // Read contents
                let files = fs.readdirSync(dir);
                files.forEach(function (file) {
                    // Drill into sub-folders, but only once!
                    if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
                        findSuites(dir + file + '/', true);
                    }
                    // Push in any JS files
                    else if (file.match(/.js$/)) {
                        let name: string = (dir + file).replace(startFolder, '').replace(/\.js$/i, '');
                        suitesInFolder.push(name);
                    }
                });
            }
        };

        findSuites(startFolder);
        return suitesInFolder;

    }

    static findDetachedSuites(): string[] {
        const suitesInFolder: string[] = Cli.findJsFilesInTestFolder();
        let suitesAvailableToImport: string[] = [];
        let suitesInConfig: string[] = Cli.config.getSuiteNames();
        suitesInFolder.forEach(function (suiteName: string) {
            if (!suitesInConfig.includes(suiteName)) {
                suitesAvailableToImport.push(suiteName);
            }
        });
        return suitesAvailableToImport;
    }

    static addScenario(suite: SuiteConfig, scenario: {
        description: string,
        path: string,
        type: string
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            const suitePath: string = suite.getPath();
            const fileContents: string = "\n\n" +
                `suite.${scenario.type}("${scenario.description}")` + "\n" +
                `   .open("${scenario.path}")` + "\n" +
                `   .next(async context => {` + "\n" +
                `       ` + "\n" +
                `   });` + "\n";
            if (!fs.existsSync(suitePath)) {
                reject(`Suite file ${suitePath} does not exist.`)
            }
            fs.appendFile(suitePath, fileContents, function (err: string) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static addSuite(opts: iSuiteOpts): Promise<iSuiteOpts> {
        return new Promise((resolve, reject) => {
            const suitePath: string = Cli.config.getTestsFolder() + opts.suiteName + '.js';
            let domains: string = '';
            if (typeof opts.baseDomain == 'string') {
                domains = `'${opts.baseDomain}'`;
            }
            else if (toType(opts.baseDomain) == 'object') {
                domains += "{\n";
                for (let env in opts.baseDomain) {
                    let domain: string = opts.baseDomain[env];
                    domains += `      ${env}: '${domain}',` + "\n";
                };
                domains += "   }";
            }
            let fileContents: string = `const { Flagpole } = require('flagpole');` + "\n\n";
            fileContents += `const suite = Flagpole.suite('${opts.suiteDescription}')` + "\n";
            fileContents += `   .base(${domains});` + "\n\n";
            fileContents += `suite.${opts.scenarioType}("${opts.scenarioDescription}")` + "\n";
            fileContents += `   .open("${opts.scenarioPath}")` + "\n";
            fileContents += `   .next(async context => {` + "\n";
            fileContents += `       ` + "\n";
            fileContents += `   });` + "\n\n";
            fs.writeFile(suitePath, fileContents, function (err: string) {
                if (err) {
                    return reject(err);
                }
                Cli.config.addSuite(opts.suiteName);
                Cli.config.save().then(() => {
                    Cli.refreshConfig();
                    resolve(opts)
                }).catch(reject);
            });
        });
    }

    static init(opts: iInitOpts): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const testsFolder: string = process.cwd() + '/' + opts.testsPath;
            const configFilePath: string = process.cwd() + '/flagpole.json';
            const configFile: FlagpoleConfig = new FlagpoleConfig({
                configPath: configFilePath,
                project: {
                    name: opts.projectName,
                    path: opts.testsPath
                }
            });
            let tasks: string[] = [];
            // Add environemnts
            opts.environments.forEach(envName => {
                configFile.addEnvironment(envName);
            });
            // Create tests folder
            if (!fs.existsSync(testsFolder)) {
                fs.mkdirSync(testsFolder);
                tasks.push('Created tests folder: ' + testsFolder);
            }
            else {
                tasks.push('Tests folder already existed: ' + testsFolder);
            }
            // Save config
            configFile.save()
                .then(() => {
                    tasks.push('Saved config file.');
                    Cli.parseConfigFile(configFilePath);
                    resolve(tasks);
                })
                .catch((err) => {
                    reject(`Error creating project config file: ${configFilePath}. ${err}`);
                });
        });
    }

}
