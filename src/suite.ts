import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { iLogLine, LogLineType, HeadingLine, DecorationLine, CommentLine, LineBreak, CustomLine, ConsoleColor, SubheadingLine, LogLine, HorizontalRule } from "./consoleline";
import { URL } from 'url';
import { FlagpoleOutput } from './flagpole';

/**
 * A suite contains many scenarios
 */
export class Suite {

    public scenarios: Array<Scenario> = [];

    protected title: string;
    protected baseUrl: URL | null = null;
    protected start: number;
    protected waitToExecute: boolean = false;
    protected callback: Function | null = null;

    protected _verifySslCert: boolean = true;

    constructor(title: string) {
        this.title = title;
        this.start = Date.now();
    }

    public verifySslCert(verify: boolean): Suite {
        this._verifySslCert = verify;
        return this;
    }

    /**
     *
     * @param {Function} callback
     * @returns {Suite}
     */
    public onDone(callback: Function): Suite {
        this.callback = callback;
        return this
    }

    /**
     * By default tell scenarios in this suite not to run until specifically told to by execute()
     *
     * @param {boolean} bool
     * @returns {Suite}
     */
    public wait(bool: boolean = true): Suite {
        this.waitToExecute = bool;
        return this;
    }

    /**
     * Have all of the scenarios in this suite completed?
     *
     * @returns {boolean}
     */
    public isDone(): boolean {
        let isDone: boolean =  this.scenarios.every(function(scenario) {
            return scenario.isDone();
        });
        if (isDone && this.callback) {
            this.callback(this);
        }
        return isDone;
    }

    /**
     * How long has this been running?
     *
     * @returns {number}
     */
    public getDuration(): number {
        return Date.now() - this.start;
    }

    /**
     * Print all logs to console
     *
     * @returns {Suite}
     */
    public print(): Suite {
        if (Flagpole.logOutput) {
            this.getLines().forEach(function (line: iLogLine) {
                if (line.type != LogLineType.Decoration) {
                    line.print();
                }
            });
        }
        else {
            if (Flagpole.getOutput() == FlagpoleOutput.html) {
                console.log(this.toHTML());
            }
            else if (Flagpole.getOutput() == FlagpoleOutput.json) {
                console.log(JSON.stringify(this.toJson(), null, 2));
            }
            else {
                this.getLines().forEach(function (line: iLogLine) {
                    line.print();
                });
            }
        }
        return this;
    }

    public getLines(): iLogLine[] {
        let lines: iLogLine[] = [];
        lines.push(new HorizontalRule('='));
        lines.push(new HeadingLine(this.title));
        lines.push(new HorizontalRule('='));
        lines.push(new CommentLine('Base URL: ' + this.baseUrl));
        lines.push(new CommentLine('Environment: ' + Flagpole.getEnvironment()));
        lines.push(new CommentLine('Took ' + this.getDuration() + 'ms'));

        let color: ConsoleColor = this.passed() ? ConsoleColor.FgGreen : ConsoleColor.FgRed;
        lines.push(new CustomLine(' »   Passed? ' + (this.passed() ? 'Yes' : 'No'), color));
        lines.push(new LineBreak());

        this.scenarios.forEach(function (scenario) {
            scenario.getLog().forEach(function (line: iLogLine) {
                lines.push(line);
            });
            lines.push(new LineBreak());
        });

        return lines;
    }

    public toConsoleString(): string {
        let text: string = '';
        this.getLines().forEach(function (line: iLogLine) {
            text += line.toConsoleString() + "\n";
        });
        return text;
    }

    public toString(): string {
        let text: string = '';
        this.getLines().forEach(function (line: iLogLine) {
            text += line.toString() + "\n";
        });
        return text;
    }

    /**
     * Get JSON output
     *
     * @returns {any}
     */
    public toJson(): any {
        let out: any = {
            title: this.title,
            baseUrl: this.baseUrl,
            summary: {},
            scenarios: []
        };
        let failCount: number = 0;
        let passCount: number = 0;
        this.scenarios.forEach(function(scenario, index) {
            out.scenarios[index] = {
                done: scenario.isDone(),
                failCount: 0,
                passCount: 0,
                log: []
            };
            scenario.getLog().forEach(function(line: iLogLine) {
                out.scenarios[index].log.push(line.toJson());
                if (line.type == LogLineType.Pass) {
                    out.scenarios[index].passCount++;
                    passCount++;
                }
                else if (line.type == LogLineType.Fail) {
                    out.scenarios[index].failCount++;
                    failCount++;
                }
            });
        });
        out.summary = {
            passed: (failCount == 0),
            passCount: passCount,
            failCount: failCount,
            duration: this.getDuration()
        }
        return out;
    }

    public toHTML(): string {
        let html: string = '';
        html += '<article class="suite">' + "\n";
        html += new HeadingLine(this.getTitle()).toHTML() + "\n";
        html += "<aside>\n";
        html += "<ul>\n";
        html += new CommentLine('Duartion: ' + this.getDuration() + 'ms').toHTML();
        html += new CommentLine('Base URL: ' + this.baseUrl).toHTML();
        html += new CommentLine('Environment: ' + Flagpole.getEnvironment()).toHTML();
        html += "</ul>\n";
        html += "</aside>\n";
        this.scenarios.forEach(function (scenario: Scenario) {
            html += '<section class="scenario">' + "\n";
            html += new SubheadingLine(scenario.getTitle()).toHTML() + "\n";
            html += "<ul>\n";
            scenario.getLog().forEach(function (line: iLogLine) {
                if (
                    line.type == LogLineType.Pass ||
                    line.type == LogLineType.Fail ||
                    line.type == LogLineType.Comment
                ) {
                    html += line.toHTML();
                }
            });
            html += "</ul>\n";
            html += "</section>\n";
        });
        html += "</article>\n";
        return html;
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Create a new scenario for this suite
     *
     * @param {string} title
     * @param {[string]} tags
     * @returns {Scenario}
     * @constructor
     */
    public Scenario(title: string): Scenario {
        let suite: Suite = this;
        let scenario: Scenario = new Scenario(this, title, function() {
            if (suite.isDone()) {
                if (Flagpole.automaticallyPrintToConsole) {
                    suite.print();
                }
                process.exit(
                    suite.passed() ? 0 : 1
                );
            }
        });
        scenario.verifySslCert(this._verifySslCert);
        if (this.waitToExecute) {
            scenario.wait();
        }
        this.scenarios.push(scenario);
        return scenario;
    }

    public Json(title: string): Scenario {
        return this.Scenario(title).json();
    }

    public Image(title: string): Scenario {
        return this.Scenario(title).image();
    }

    public Html(title: string): Scenario {
        return this.Scenario(title).html();
    }

    public Stylesheet(title: string): Scenario {
        return this.Scenario(title).stylesheet();
    }

    public Script(title: string): Scenario {
        return this.Scenario(title).script();
    }

    public Resource(title: string): Scenario {
        return this.Scenario(title).resource();
    }

    /**
     * Set the base url, which is typically the domain. All scenarios will run relative to it
     *
     * @param {string} url
     * @returns {Suite}
     */
    public base(url: string | any[]): Suite {
        let baseUrl: string = '';
        if (typeof url == 'string') {
            baseUrl = url;
        }
        else if (Object.keys(url).length > 0) {
            let env = Flagpole.getEnvironment() || 'dev';
            baseUrl = url[env];
            // If env didn't match one, just pick the first one
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

    /**
     * Used by scenario to build its url
     *
     * @param {string} path
     * @returns {string}
     */
    public buildUrl(path: string): string {
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

    /**
     * If suite was told to wait, this will tell each scenario in it to run
     *
     * @returns {Suite}
     */
    public execute(): Suite {
        this.scenarios.forEach(function(scenario) {
            scenario.execute();
        });
        return this;
    }

    /**
     * Did every scenario in this suite pass?
     *
     * @returns {boolean}
     */
    public passed(): boolean {
        return this.scenarios.every(function(scenario) {
            return scenario.passed();
        });
    }

    /**
     * Did any scenario in this suite fail?
     *
     * @returns {boolean}
     */
    public failed(): boolean {
        return this.scenarios.some(function(scenario) {
            return scenario.failed();
        });
    }

}