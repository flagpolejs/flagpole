"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const scenario_1 = require("./scenario");
const consoleline_1 = require("./consoleline");
class Suite {
    constructor(title) {
        this.scenarios = [];
        this.baseUrl = null;
        this.waitToExecute = false;
        this.usingConsoleOutput = true;
        this.callback = null;
        this._verifySslCert = true;
        this.title = title;
        this.start = Date.now();
    }
    verifySslCert(verify) {
        this._verifySslCert = verify;
        return this;
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
        index_1.Flagpole.message('» Environment: ' + index_1.Flagpole.environment);
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
    Scenario(title) {
        let suite = this;
        let scenario = new scenario_1.Scenario(this, title, function () {
            if (suite.isDone()) {
                if (suite.usingConsoleOutput) {
                    suite.print();
                    process.exit(suite.passed() ? 0 : 1);
                }
            }
        });
        scenario.verifySslCert(this._verifySslCert);
        if (this.waitToExecute) {
            scenario.wait();
        }
        this.scenarios.push(scenario);
        return scenario;
    }
    Json(title) {
        return this.Scenario(title).json();
    }
    Image(title) {
        return this.Scenario(title).image();
    }
    Html(title) {
        return this.Scenario(title).html();
    }
    Stylesheet(title) {
        return this.Scenario(title).stylesheet();
    }
    Script(title) {
        return this.Scenario(title).script();
    }
    Resource(title) {
        return this.Scenario(title).resource();
    }
    base(url) {
        let baseUrl = '';
        if (typeof url == 'string') {
            baseUrl = url;
        }
        else if (Object.keys(url).length > 0) {
            let env = index_1.Flagpole.environment || 'dev';
            baseUrl = url[env];
            if (!baseUrl) {
                baseUrl = url[Object.keys(url)[0]];
            }
        }
        if (baseUrl.length > 0) {
            this.baseUrl = new URL(baseUrl);
        }
        else {
            throw Error('Invalid base url.');
        }
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
