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

    public get totalDuration(): number | null {
        return this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteInitialized) : null;
    }

    public get executionDuration(): number | null {
        return this._timeSuiteExecuted !== null && this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteExecuted) : null;
    }

    protected _onReject: Function = () => { };
    protected _onResolve: Function = () => { };
    protected _onFinally: Function = () => { };
    protected _thens: Function[] = [];
    protected _title: string;
    protected _baseUrl: URL | null = null;
    protected _timeSuiteInitialized: number = Date.now();
    protected _timeSuiteExecuted: number | null = null;
    protected _timeSuiteFinished: number | null = null;
    protected _waitToExecute: boolean = false;
    protected _verifySslCert: boolean = true;

    constructor(title: string) {
        this._title = title;
    }

    public verifySslCert(verify: boolean): Suite {
        this._verifySslCert = verify;
        return this;
    }

    /**
     * By default tell scenarios in this suite not to run until specifically told to by execute()
     *
     * @param {boolean} bool
     * @returns {Suite}
     */
    public wait(bool: boolean = true): Suite {
        this._waitToExecute = bool;
        return this;
    }

    /**
     * Did this suite start running yet?
     */
    public hasExecuted(): boolean {
        return this._timeSuiteExecuted !== null;
    }

    /**
     * Has this suite finished running?
     */
    public hasFinished(): boolean {
        return this._timeSuiteFinished !== null;
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
        lines.push(new HeadingLine(this._title));
        lines.push(new HorizontalRule('='));
        lines.push(new CommentLine('Base URL: ' + this._baseUrl));
        lines.push(new CommentLine('Environment: ' + Flagpole.getEnvironment()));
        lines.push(new CommentLine('Took ' + this.executionDuration + 'ms'));

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
            title: this._title,
            baseUrl: this._baseUrl,
            summary: {},
            scenarios: []
        };
        let failCount: number = 0;
        let passCount: number = 0;
        this.scenarios.forEach(function(scenario, index) {
            out.scenarios[index] = {
                done: scenario.hasFinished(),
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
            duration: this.executionDuration
        }
        return out;
    }

    public toHTML(): string {
        let html: string = '';
        html += '<article class="suite">' + "\n";
        html += new HeadingLine(this.getTitle()).toHTML() + "\n";
        html += "<aside>\n";
        html += "<ul>\n";
        html += new CommentLine('Duration: ' + this.executionDuration + 'ms').toHTML();
        html += new CommentLine('Base URL: ' + this._baseUrl).toHTML();
        html += new CommentLine('Environment: ' + Flagpole.getEnvironment()).toHTML();
        html += "</ul>\n";
        html += "</aside>\n";
        this.scenarios.forEach(function (scenario: Scenario) {
            html += '<section class="scenario">' + "\n";
            html += new SubheadingLine(scenario.title).toHTML() + "\n";
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
        return this._title;
    }

    /**
     * Create a new scenario for this suite
     *
     * @param {string} title
     * @param {[string]} tags
     * @returns {Scenario}
     * @constructor
     */
    public scenario = this.Scenario;
    public Scenario(title: string): Scenario {
        const suite: Suite = this;
        const scenario: Scenario = new Scenario(this, title, (thisScenario) => {
            suite._onScenarioProgress(thisScenario);
        });
        // Some local tests fail with SSL verify on, so may have been disabled on this suite
        scenario.verifySslCert(this._verifySslCert);
        // Should we hold off on executing?
        (this._waitToExecute) && scenario.wait();
        // Add this to our collection of scenarios
        this.scenarios.push(scenario);
        return scenario;
    }
    
    /**
     * Create a new JSON/REST API Scenario
     */
    public json = this.Json;
    public Json(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).json(opts);
    }

    /**
     * 
     */
    public image = this.Image;
    public Image(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).image(opts);
    }

    public video = this.Video;
    public Video(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).video(opts);
    }

    public html = this.Html;
    public Html(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).html(opts);
    }

    public stylesheet = this.Stylesheet;
    public Stylesheet(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).stylesheet(opts);
    }

    public script = this.Script;
    public Script(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).script(opts);
    }

    public resource = this.Resource;
    public Resource(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).resource(opts);
    }

    public browser = this.Browser;
    public Browser(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).browser(opts);
    }

    public extjs = this.ExtJS;
    public ExtJS(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).extjs(opts);
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
            this._baseUrl = new URL(baseUrl);
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
        if (this._baseUrl === null) {
            return path;
        }
        else if (/^https?:\/\//.test(path) || /^data:/.test(path)) {
            return path;
        }
        else if (/^\//.test(path)) {
            return this._baseUrl.protocol + '//' + this._baseUrl.host + path;
        }
        return (new URL(path, this._baseUrl.href)).href;
    }

    /**
     * If suite was told to wait, this will tell each scenario in it to run
     *
     * @returns {Suite}
     */
    public execute(): Suite {
        if (this.hasExecuted()) {
            throw new Error(`Suite already executed.`)
        }
        this._timeSuiteExecuted = Date.now();
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
     */
    public failed(): boolean {
        return this.scenarios.some(function(scenario) {
            return scenario.failed();
        });
    }

    /**
     * This callback runs once the suite is done, if it failed
     * 
     * @param callback 
     */
    public catch(callback: Function): Suite {
        this._onReject = callback;
        return this;
    }

    /**
     * This callback runs once the suite is done, if it passed
     * 
     * @param callback 
     */
    public success(callback: Function): Suite {
        this._onResolve = callback;
        return this;
    }

    /**
     * This callback will run once everything else is completed, whether pass or fail
     */
    public onDone = this.finally;
    public finally(callback: Function): Suite {
        this._onFinally = callback;
        return this;
    }

    /**
     * This callback runs once all the scenarios are complete, but before suite is marked done
     * 
     * @param callback 
     */
    public next(callback: Function): Suite {
        this._thens.push(callback);
        return this;
    }

    /**
* Have all of the scenarios in this suite completed?
*/
    private _haveAllScenariosFinished(): boolean {
        return this.scenarios.every(function (scenario) {
            return scenario.hasFinished();
        });
    }

    /**
     * Runs when a scenario's status changes
     */
    private _onScenarioProgress(scenario: Scenario) {
        const suite: Suite = this;
        // This scenario is executing
        if (scenario.hasExecuted() && !this.hasExecuted()) {
            this._timeSuiteExecuted = Date.now();
        }
        // Is every scenario completed? And only run it once
        if (this._haveAllScenariosFinished() && !this.hasFinished()) {
            // Save time ended
            this._timeSuiteFinished = Date.now();
            // Resolve as if we were a promise
            if (this.failed()) {
                this._onReject(this);
            }
            else {
                this._thens.forEach((_then) => {
                    _then(suite);
                });
                suite._onResolve(suite);
            }
            // Fire this regardless of pass or fails
            this._onFinally(this);
            // Should we print automatically?
            (Flagpole.automaticallyPrintToConsole) && this.print();
            // Should we exit on complete?
            if (Flagpole.exitOnDone) {
                process.exit(
                    this.passed() ? 0 : 1
                );
            }
        }
    }
    

}
