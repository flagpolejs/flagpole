import { FlagpoleConfig } from "./config";
import { ClorthoService, iCredentials } from 'clortho-lite';
import { printHeader } from './cli-helper';

const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const ansiAlign = require('ansi-align');

export class Cli {

    static consoleLog: Array<string> = [];
    static hideBanner: boolean = false;
    static rootPath: string = __dirname;
    static configPath: string = __dirname + '/flagpole.json';
    static config: FlagpoleConfig;
    static command: string | null = null;
    static commandArg: string | null = null;
    static commandArg2: string | null = null;
    static apiDomain: string = 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net'

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

}
