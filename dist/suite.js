"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const scenario_1 = require("./scenario");
const consoleline_1 = require("./consoleline");
const response_1 = require("./response");
class Suite {
    constructor(title) {
        this.scenarios = [];
        this.baseUrl = null;
        this.waitToExecute = false;
        this.byTag = {};
        this.usingConsoleOutput = true;
        this.callback = null;
        this.title = title;
        this.start = Date.now();
    }
    setConsoleOutput(usingConsoleOutput) {
        this.usingConsoleOutput = usingConsoleOutput;
        return this;
    }
    onDone(callback) {
        this.callback = callback;
        return this;
    }
    wait(bool = true) {
        this.waitToExecute = bool;
        return this;
    }
    isDone() {
        let isDone = this.scenarios.every(function (scenario) {
            return scenario.isDone();
        });
        if (isDone && this.callback) {
            this.callback(this);
        }
        return isDone;
    }
    getDuration() {
        return Date.now() - this.start;
    }
    print() {
        index_1.Flagpole.heading(this.title);
        index_1.Flagpole.message('» Base URL: ' + this.baseUrl);
        index_1.Flagpole.message('» Environment: ' + process.env.FLAGPOLE_ENV);
        index_1.Flagpole.message('» Took ' + this.getDuration() + "ms\n");
        let color = this.passed() ? "\x1b[32m" : "\x1b[31m";
        index_1.Flagpole.message('» Passed? ' + (this.passed() ? 'Yes' : 'No') + "\n", color);
        this.scenarios.forEach(function (scenario) {
            scenario.getLog().forEach(function (line) {
                line.write();
            });
        });
        return this;
    }
    toJson() {
        let out = {
            title: this.title,
            baseUrl: this.baseUrl,
            duration: this.getDuration(),
            scenarios: []
        };
        this.scenarios.forEach(function (scenario, index) {
            out.scenarios[index] = {
                done: scenario.isDone(),
                failCount: 0,
                passCount: 0,
                log: []
            };
            scenario.getLog().forEach(function (line) {
                out.scenarios[index].log.push(line.toJson());
                if (line.type == consoleline_1.LogType.Pass) {
                    out.scenarios[index].passCount++;
                }
                else if (line.type == consoleline_1.LogType.Fail) {
                    out.scenarios[index].failCount++;
                }
            });
        });
        return out;
    }
    Scenario(title, tags) {
        let suite = this;
        let scenario = new scenario_1.Scenario(this, title, function () {
            if (suite.isDone()) {
                if (suite.usingConsoleOutput) {
                    suite.print();
                    process.exit(suite.passed() ? 0 : 1);
                }
            }
        });
        if (this.waitToExecute) {
            scenario.wait();
        }
        if (typeof tags !== 'undefined') {
            tags.forEach(function (tag) {
                suite.byTag.hasOwnProperty(tag) ?
                    suite.byTag[tag].push(scenario) :
                    (suite.byTag[tag] = [scenario]);
            });
        }
        this.scenarios.push(scenario);
        return scenario;
    }
    Json(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.json);
    }
    Image(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.image);
    }
    Html(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.html);
    }
    Stylesheet(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.stylesheet);
    }
    Script(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.script);
    }
    Resource(title, tags) {
        return this.Scenario(title, tags).type(response_1.ResponseType.resource);
    }
    getScenarioByTag(tag) {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag][0] : null;
    }
    getAllScenariosByTag(tag) {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag] : [];
    }
    base(url) {
        this.baseUrl = new URL(url);
        return this;
    }
    buildUrl(path) {
        if (this.baseUrl === null) {
            return path;
        }
        else if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            return path;
        }
        else if (path.startsWith('/')) {
            return this.baseUrl.protocol + '//' + this.baseUrl.host + path;
        }
        return (new URL(path, this.baseUrl.href)).href;
    }
    execute() {
        this.scenarios.forEach(function (scenario) {
            scenario.execute();
        });
        return this;
    }
    passed() {
        return this.scenarios.every(function (scenario) {
            return scenario.passed();
        });
    }
    failed() {
        return this.scenarios.some(function (scenario) {
            return scenario.failed();
        });
    }
}
exports.Suite = Suite;
