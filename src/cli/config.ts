import { Cli } from "./cli-helper";
import { Flagpole } from "..";

const fs = require('fs');
const path = require('path');

export class EnvConfig {

    protected config: FlagpoleConfig;

    public name: string;
    public defaultDomain: string;

    constructor(config: FlagpoleConfig, opts: any) {
        this.config = config;
        this.name = opts.name || '';
        this.defaultDomain = opts.defaultDomain || '';
    }

}

export class SuiteConfig {

    protected config: FlagpoleConfig;
    public name: string;

    constructor(config: FlagpoleConfig, opts: any) {
        this.config = config;
        this.name = opts.name || '';
    }

    public getPath(): string {
        return this.config.getTestsFolder() + this.name + '.js';
    }

}

export class FlagpoleConfig {

    protected configPath: string;
    
    public projectName: string;
    public testFolderName: string;
    public suites: { [key: string]: SuiteConfig } = {};
    public environments: { [key: string]: EnvConfig } = {};

    constructor(configData: any = {}) {
        let config: FlagpoleConfig = this;
        // Implicit (do not show up in the config file output)
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        // Explicit (can be set and show in config file output)
        this.projectName = configData.project || 'default';
        this.testFolderName = configData.path || 'tests';
        if (Flagpole.toType(configData.suites) == 'object') {
            for (let key in configData.suites) {
                configData.suites[key]['name'] = key;
                config.suites[key] = new SuiteConfig(this, configData.suites[key]);
            }
        }
        if (Flagpole.toType(configData.environments) == 'object') {
            for (let key in configData.environments) {
                configData.environments[key]['name'] = key;
                config.environments[key] = new EnvConfig(this, configData.environments[key]);
            }
        }
    }

    public getConfigFolder(): string {
        return path.dirname(this.configPath);
    }

    public getConfigPath(): string {
        return this.configPath;
    }

    public getTestsFolder(): string {
        return Cli.normalizePath(this.getConfigFolder() + '/' + this.testFolderName);
    }

    public addEnvironment(name: string, opts: {} = {}) {
        if (name.length) {
            this.environments[name] = new EnvConfig(
                this,
                Object.assign(opts, { name: name })
            );
        }
    }

    public addSuite(name: string, opts: {} = {}) {
        if (name.length) {
            this.suites[name] = new SuiteConfig(
                this,
                Object.assign(opts, { name: name })
            );
        }
    }

    public removeEnvironment(name: string) {
        delete this.environments[name];
    }

    public removeSuite(name: string) {
        delete this.suites[name];
    }

    public getEnvironments(): EnvConfig[] {
        let envConfigs: EnvConfig[] = [];
        for (let key in this.environments) {
            envConfigs.push(this.environments[key]);
        }
        return envConfigs;
    }

    public getEnvironmentNames(): string[] {
        let envs: string[] = [];
        for (let key in this.environments) {
            envs.push(this.environments[key].name);
        }
        return envs;
    }

    public getSuites(): SuiteConfig[] {
        let suiteConfigs: SuiteConfig[] = [];
        for (let key in this.suites) {
            suiteConfigs.push(this.suites[key]);
        }
        return suiteConfigs;
    }

    public getSuiteNames(): string[] {
        let suiteNames: string[] = [];
        for (let key in this.suites) {
            suiteNames.push(this.suites[key].name);
        }
        return suiteNames;
    }

    public isValid(): boolean {
        if (typeof this.projectName == 'undefined' || this.projectName.length == 0) {
            return false;
        }
        if (typeof this.getTestsFolder() == 'undefined' || !fs.existsSync(this.getTestsFolder())) {
            return false;
        }
        if (Object.keys(this.environments).length == 0) {
            return false;
        }
        return true;
    }

    public toString(): string {
        let config: FlagpoleConfig = this;
        return JSON.stringify({
            project: this.projectName,
            path: this.testFolderName,
            environments: (function () {
                let envs: any = {};
                for (let key in config.environments) {
                    envs[key] = {
                        name: config.environments[key].name,
                        defaultDomain: config.environments[key].defaultDomain
                    };
                }
                return envs;
            })(),
            suites: (function () {
                let suites: any = {};
                for (let key in config.suites) {
                    suites[key] = {
                        name: config.suites[key].name
                    };
                }
                return suites;
            })()
        }, null, 2);
    }

}