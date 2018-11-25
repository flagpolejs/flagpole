import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { ConsoleLine, LogType } from "./consoleline";
import { ReponseType } from "./response";

/**
 * A suite contains many scenarios
 */
export class Suite {

    public scenarios: Array<Scenario> = [];

    protected title: string;
    protected baseUrl: URL | null = null;
    protected start: number;
    protected waitToExecute: boolean = false;
    protected byTag: any = {};
    protected usingConsoleOutput: boolean = true;
    protected callback: Function|null = null;

    constructor(title: string) {
        this.title = title;
        this.start = Date.now();
    }

    /**
     * Whether or not to automatically push output to console. This is really if we are using at command line or not.
     *
     * @param {boolean} usingConsoleOutput
     * @returns {Suite}
     */
    public setConsoleOutput(usingConsoleOutput: boolean): Suite {
        this.usingConsoleOutput = usingConsoleOutput;
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
        Flagpole.heading(this.title);
        Flagpole.message('» Base URL: ' + this.baseUrl);
        Flagpole.message('» Environment: ' + process.env.FLAGPOLE_ENV);
        Flagpole.message('» Took ' + this.getDuration() + "ms\n");

        let color: string = this.passed() ? "\x1b[32m" : "\x1b[31m";
        Flagpole.message('» Passed? ' + (this.passed() ? 'Yes' : 'No') + "\n", color);

        this.scenarios.forEach(function(scenario) {
            scenario.getLog().forEach(function(line: ConsoleLine) {
                line.write();
            });
        });
        return this;
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
            duration: this.getDuration(),
            scenarios: []
        };
        this.scenarios.forEach(function(scenario, index) {
            out.scenarios[index] = {
                done: scenario.isDone(),
                failCount: 0,
                passCount: 0,
                log: []
            };
            scenario.getLog().forEach(function(line: ConsoleLine) {
                out.scenarios[index].log.push(line.toJson());
                if (line.type == LogType.Pass) {
                    out.scenarios[index].passCount++;
                }
                else if (line.type == LogType.Fail) {
                    out.scenarios[index].failCount++;
                }
            });
        });
        return out;
    }

    /**
     * Create a new scenario for this suite
     *
     * @param {string} title
     * @param {[string]} tags
     * @returns {Scenario}
     * @constructor
     */
    public Scenario(title: string, tags?: [string]): Scenario {
        let suite: Suite = this;
        let scenario: Scenario = new Scenario(this, title, function() {
            if (suite.isDone()) {
                if (suite.usingConsoleOutput) {
                    suite.print();
                    process.exit(
                        suite.passed() ? 0 : 1
                    );
                }
            }
        });
        if (this.waitToExecute) {
            scenario.wait();
        }
        if (typeof tags !== 'undefined') {
            tags.forEach(function(tag: string) {
                suite.byTag.hasOwnProperty(tag) ?
                    suite.byTag[tag].push(scenario) :
                    (suite.byTag[tag] = [scenario]);
            });
        }
        this.scenarios.push(scenario);
        return scenario;
    }

    public Json(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.json);
    }

    public Image(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.image);
    }

    public Html(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.html);
    }

    public Stylesheet(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.stylesheet);
    }

    public Script(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.script);
    }

    public Resource(title: string, tags?: [string]): Scenario {
        return this.Scenario(title, tags).type(ReponseType.resource);
    }

    /**
     * Search scenarios in this suite for one with this tag
     *
     * @param {string} tag
     * @returns {Scenario}
     */
    public getScenarioByTag(tag: string): Scenario {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag][0] : null;
    }

    /**
     * Search scenarios in this suite and find all of them with this tag
     *
     * @param {string} tag
     * @returns {[Scenario]}
     */
    public getAllScenariosByTag(tag: string): [Scenario] {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag] : [];
    }

    /**
     * Set the base url, which is typically the domain. All scenarios will run relative to it
     *
     * @param {string} url
     * @returns {Suite}
     */
    public base(url: string): Suite {
        this.baseUrl = new URL(url);
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