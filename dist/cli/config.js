"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const __1 = require("..");
const fs = require('fs');
const path = require('path');
class EnvConfig {
    constructor(config, opts) {
        this.config = config;
        this.name = opts.name || '';
        this.defaultDomain = opts.defaultDomain || '';
    }
}
exports.EnvConfig = EnvConfig;
class SuiteConfig {
    constructor(config, opts) {
        this.config = config;
        this.name = opts.name || '';
        this.id = opts.id || '';
    }
    getPath() {
        return this.config.getTestsFolder() + this.name + '.js';
    }
}
exports.SuiteConfig = SuiteConfig;
class ProjectConfig {
    constructor(config, opts) {
        this.id = '';
        this.name = 'default';
        this.path = 'tests';
        this.config = config;
        if (__1.Flagpole.toType(opts) == 'object') {
            this.id = opts.id || '';
            this.name = opts.name || 'default';
            this.path = opts.path || 'tests';
        }
    }
    hasId() {
        return (this.id.length > 0);
    }
    toJson() {
        return {
            id: this.id,
            name: this.name,
            path: this.path
        };
    }
}
exports.ProjectConfig = ProjectConfig;
class FlagpoleConfig {
    constructor(configData = {}) {
        this.suites = {};
        this.environments = {};
        let config = this;
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        this.project = new ProjectConfig(this, configData.project);
        if (__1.Flagpole.toType(configData.suites) == 'object') {
            for (let key in configData.suites) {
                configData.suites[key]['name'] = key;
                config.suites[key] = new SuiteConfig(this, configData.suites[key]);
            }
        }
        if (__1.Flagpole.toType(configData.environments) == 'object') {
            for (let key in configData.environments) {
                configData.environments[key]['name'] = key;
                config.environments[key] = new EnvConfig(this, configData.environments[key]);
            }
        }
    }
    getConfigFolder() {
        return path.dirname(this.configPath);
    }
    getConfigPath() {
        return this.configPath;
    }
    getTestsFolder() {
        return cli_helper_1.Cli.normalizePath(this.getConfigFolder() + '/' + this.project.path);
    }
    addEnvironment(name, opts = {}) {
        if (name.length) {
            this.environments[name] = new EnvConfig(this, Object.assign(opts, { name: name }));
        }
    }
    addSuite(name, opts = {}) {
        if (name.length) {
            this.suites[name] = new SuiteConfig(this, Object.assign(opts, { name: name }));
        }
    }
    removeEnvironment(name) {
        delete this.environments[name];
    }
    removeSuite(name) {
        delete this.suites[name];
    }
    getEnvironments() {
        let envConfigs = [];
        for (let key in this.environments) {
            envConfigs.push(this.environments[key]);
        }
        return envConfigs;
    }
    getEnvironmentNames() {
        let envs = [];
        for (let key in this.environments) {
            envs.push(this.environments[key].name);
        }
        return envs;
    }
    getSuites() {
        let suiteConfigs = [];
        for (let key in this.suites) {
            suiteConfigs.push(this.suites[key]);
        }
        return suiteConfigs;
    }
    getSuiteNames() {
        let suiteNames = [];
        for (let key in this.suites) {
            suiteNames.push(this.suites[key].name);
        }
        return suiteNames;
    }
    isValid() {
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
    toString() {
        let config = this;
        return JSON.stringify({
            project: this.project.toJson(),
            environments: (function () {
                let envs = {};
                for (let key in config.environments) {
                    envs[key] = {
                        name: config.environments[key].name,
                        defaultDomain: config.environments[key].defaultDomain
                    };
                }
                return envs;
            })(),
            suites: (function () {
                let suites = {};
                for (let key in config.suites) {
                    suites[key] = {
                        name: config.suites[key].name
                    };
                }
                return suites;
            })()
        }, null, 2);
    }
    save() {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.getConfigPath(), this.toString(), function (err) {
                if (err)
                    return reject();
                resolve();
            });
        });
    }
}
exports.FlagpoleConfig = FlagpoleConfig;
