"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const scenario_1 = require("./scenario");
const consoleline_1 = require("./consoleline");
const url_1 = require("url");
const flagpole_1 = require("./flagpole");
class Suite {
    constructor(title) {
        this.scenarios = [];
        this.baseUrl = null;
        this.waitToExecute = false;
        this.callback = null;
        this._verifySslCert = true;
        this.title = title;
        this.start = Date.now();
    }
    verifySslCert(verify) {
        this._verifySslCert = verify;
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
        if (index_1.Flagpole.logOutput) {
            this.getLines().forEach(function (line) {
                if (line.type != consoleline_1.LogLineType.Decoration) {
                    line.print();
                }
            });
        }
        else {
            if (index_1.Flagpole.getOutput() == flagpole_1.FlagpoleOutput.html) {
                console.log(this.toHTML());
            }
            else if (index_1.Flagpole.getOutput() == flagpole_1.FlagpoleOutput.json) {
                console.log(JSON.stringify(this.toJson(), null, 2));
            }
            else {
                this.getLines().forEach(function (line) {
                    line.print();
                });
            }
        }
        return this;
    }
    getLines() {
        let lines = [];
        lines.push(new consoleline_1.HorizontalRule('='));
        lines.push(new consoleline_1.HeadingLine(this.title));
        lines.push(new consoleline_1.HorizontalRule('='));
        lines.push(new consoleline_1.CommentLine('Base URL: ' + this.baseUrl));
        lines.push(new consoleline_1.CommentLine('Environment: ' + index_1.Flagpole.getEnvironment()));
        lines.push(new consoleline_1.CommentLine('Took ' + this.getDuration() + 'ms'));
        let color = this.passed() ? consoleline_1.ConsoleColor.FgGreen : consoleline_1.ConsoleColor.FgRed;
        lines.push(new consoleline_1.CustomLine(' »   Passed? ' + (this.passed() ? 'Yes' : 'No'), color));
        lines.push(new consoleline_1.LineBreak());
        this.scenarios.forEach(function (scenario) {
            scenario.getLog().forEach(function (line) {
                lines.push(line);
            });
            lines.push(new consoleline_1.LineBreak());
        });
        return lines;
    }
    toConsoleString() {
        let text = '';
        this.getLines().forEach(function (line) {
            text += line.toConsoleString() + "\n";
        });
        return text;
    }
    toString() {
        let text = '';
        this.getLines().forEach(function (line) {
            text += line.toString() + "\n";
        });
        return text;
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
                if (line.type == consoleline_1.LogLineType.Pass) {
                    out.scenarios[index].passCount++;
                }
                else if (line.type == consoleline_1.LogLineType.Fail) {
                    out.scenarios[index].failCount++;
                }
            });
        });
        return out;
    }
    toHTML() {
        let html = '';
        html += '<article class="suite">' + "\n";
        html += new consoleline_1.HeadingLine(this.getTitle()).toHTML() + "\n";
        html += "<aside>\n";
        html += "<ul>\n";
        html += new consoleline_1.CommentLine('Duartion: ' + this.getDuration() + 'ms').toHTML();
        html += new consoleline_1.CommentLine('Base URL: ' + this.baseUrl).toHTML();
        html += new consoleline_1.CommentLine('Environment: ' + index_1.Flagpole.getEnvironment()).toHTML();
        html += "</ul>\n";
        html += "</aside>\n";
        this.scenarios.forEach(function (scenario) {
            html += '<section class="scenario">' + "\n";
            html += new consoleline_1.SubheadingLine(scenario.getTitle()).toHTML() + "\n";
            html += "<ul>\n";
            scenario.getLog().forEach(function (line) {
                if (line.type == consoleline_1.LogLineType.Pass ||
                    line.type == consoleline_1.LogLineType.Fail ||
                    line.type == consoleline_1.LogLineType.Comment) {
                    html += line.toHTML();
                }
            });
            html += "</ul>\n";
            html += "</section>\n";
        });
        html += "</article>\n";
        return html;
    }
    getTitle() {
        return this.title;
    }
    Scenario(title) {
        let suite = this;
        let scenario = new scenario_1.Scenario(this, title, function () {
            if (suite.isDone()) {
                if (index_1.Flagpole.automaticallyPrintToConsole) {
                    suite.print();
                }
                process.exit(suite.passed() ? 0 : 1);
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
            let env = index_1.Flagpole.getEnvironment() || 'dev';
            baseUrl = url[env];
            if (!baseUrl) {
                baseUrl = url[Object.keys(url)[0]];
            }
        }
        if (baseUrl.length > 0) {
            this.baseUrl = new url_1.URL(baseUrl);
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
        return (new url_1.URL(path, this.baseUrl.href)).href;
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
