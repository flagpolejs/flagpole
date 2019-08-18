import { Cli } from './cli';
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
    public id: string;
    public name: string;
    public tags: string[] = [];
    
    constructor(config: FlagpoleConfig, opts: any) {
        this.config = config;
        this.name = opts.name || '';
        this.id = opts.id || '';
        if (Flagpole.toType(opts.tags) == 'array') {
            (opts.tags as Array<string>).forEach(tag => {
                this.tags.push(String(tag));
            });
        }
    }

    public getPath(): string {
        return this.config.getTestsFolder() + this.name + '.js';
    }

    public clearTags() {
        this.tags = [];
    }

    public addTag(tag: string) {
        tag = String(tag).trim();
        if (tag.length && this.tags.indexOf(tag) < 0) {
            this.tags.push(tag);
        }
    }

}

export class ProjectConfig {

    protected config: FlagpoleConfig;
    public id: string = '';
    public name: string = 'default';
    public path: string = 'tests';

    constructor(config: FlagpoleConfig, opts: any) {
        this.config = config;
        if (Flagpole.toType(opts) == 'object') {
            this.id = opts.id || '';
            this.name = opts.name || 'default';
            this.path = opts.path || 'tests';
        }
    }

    public hasId(): boolean {
        return (this.id.length > 0);
    }

    public toJson() {
        return {
            id: this.id,
            name: this.name,
            path: this.path
        }
    }

}

export class FlagpoleConfig {

    protected configPath: string;
    
    public project: ProjectConfig;
    public suites: { [key: string]: SuiteConfig } = {};
    public environments: { [key: string]: EnvConfig } = {};

    constructor(configData: any = {}) {
        let config: FlagpoleConfig = this;
        // Implicit (do not show up in the config file output)
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        // Explicit (can be set and show in config file output)
        this.project = new ProjectConfig(this, configData.project);
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
        return Cli.normalizePath(this.getConfigFolder() + '/' + this.project.path);
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
            const suite: SuiteConfig = new SuiteConfig(
                this,
                Object.assign(opts, { name: name })
            );
            this.suites[name] = suite;
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
        if (this.project === null || this.project.name.length == 0 || this.project.path.length == 0) {
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
            project: this.project.toJson(),
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
                        name: config.suites[key].name,
                        tags: config.suites[key].tags
                    };
                }
                return suites;
            })()
        }, null, 2);
    }

    public save(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.getConfigPath(), this.toString(), function (err) {
                if (err) {
                    return reject(err);
                }
                Cli.refreshConfig();
                resolve();
            });
        });
    }

}