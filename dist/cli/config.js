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
    }
    getPath() {
        return this.config.getTestsFolder() + this.name + '.js';
    }
}
exports.SuiteConfig = SuiteConfig;
class FlagpoleConfig {
    constructor(configData = {}) {
        this.suites = {};
        this.environments = {};
        let config = this;
        this.configPath = configData.configPath || process.cwd() + '/flagpole.json';
        this.projectName = configData.project || 'default';
        this.testFolderName = configData.path || 'tests';
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
        return cli_helper_1.Cli.normalizePath(this.getConfigFolder() + '/' + this.testFolderName);
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
    toString() {
        let config = this;
        return JSON.stringify({
            project: this.projectName,
            path: this.testFolderName,
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
}
exports.FlagpoleConfig = FlagpoleConfig;
