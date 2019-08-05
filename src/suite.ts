import { Flagpole } from "./index";
import { Scenario, ScenarioStatusEvent } from "./scenario";
import { URL } from 'url';
import { FlagpoleReport } from './flagpolereport';

export enum SuiteStatusEvent {
    beforeAllExecute,
    beforeEachExecute,
    afterEachExecute,
    afterAllExecute,
    finished
}

/**
 * A suite contains many scenarios
 */
export class Suite {

    public scenarios: Array<Scenario> = [];

    public get baseUrl(): URL | null {
        return this._baseUrl;
    }

    public get totalDuration(): number | null {
        return this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteInitialized) : null;
    }

    public get executionDuration(): number | null {
        return this._timeSuiteExecuted !== null && this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteExecuted) : null;
    }

    public get title(): string {
        return this._title;
    }

    protected _subscribers: Function[] = [];
    protected _onReject: Function = () => { };
    protected _onResolve: Function = () => { };
    protected _onFinally: Function = () => { };
    protected _onBeforeAll: Function = () => { }
    protected _onAfterAll: Function = () => { }
    protected _onBeforeEach: Function = () => { }
    protected _onAfterEach: Function = () => { }
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

    /**
     * PubSub Subscription
     * 
     * @param callback 
     */
    public subscribe(callback: Function) {
        this._subscribers.push(callback);
    }

    /**
     * Turn on or off SSL verification
     */
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
    public print(exitAfterPrint: boolean = true): void {
        const report: FlagpoleReport = new FlagpoleReport(this);
        report.print()
            .then(() => {
                exitAfterPrint && Flagpole.exit(this.passed())
            });
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
        const scenario: Scenario = new Scenario(this, title);
        // Notify suite on any changes to scenario
        scenario.subscribe((thisScenario, status) => {
            this._onScenarioStatusChange(thisScenario, status)
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
     * Create a new Image Scenario
     */
    public image = this.Image;
    public Image(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).image(opts);
    }

    /**
     * Create a new Video Scenario
     */
    public video = this.Video;
    public Video(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).video(opts);
    }

    /**
     * Create a new HTML/DOM Scenario
     */
    public html = this.Html;
    public Html(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).html(opts);
    }

    /**
     * Create a new CSS Scenario
     */
    public stylesheet = this.Stylesheet;
    public Stylesheet(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).stylesheet(opts);
    }

    /**
     * Create a new Script Scenario
     */
    public script = this.Script;
    public Script(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).script(opts);
    }

    /**
     * Create a generic resource scenario
     */
    public resource = this.Resource;
    public Resource(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).resource(opts);
    }

    /**
     * Create a Browser/Puppeteer Scenario
     */
    public browser = this.Browser;
    public Browser(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).browser(opts);
    }

    /**
     * Create an ExtJS Scenario
     */
    public extjs = this.ExtJS;
    public ExtJS(title: string, opts: any = {}): Scenario {
        return this.Scenario(title).extjs(opts);
    }

    /**
     * Set the base url, which is typically the domain. All scenarios will run relative to it.
     * Argument can also be an object where the key is the environment and the value is the base url.
     *
     * @param {string | {}} url
     * @returns {Suite}
     */
    public base(url: string | {}): Suite {
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
        return this.scenarios.some(function (scenario) {
            return scenario.failed();
        });
    }

    /**
     * This callback will run right before the first scenario starts to execute
     * 
     * @param callback 
     */
    public before(callback: Function): Suite {
        this._onBeforeAll = callback;
        return this;
    }

    /**
     * Set callback that will run before each Scenario starts executing
     * 
     * @param callback 
     */
    public beforeEach(callback: Function): Suite {
        this._onBeforeEach = callback;
        return this;
    }

    /**
     * Set callback that will run after each Scenario completes execution
     * 
     * @param callback 
     */
    public afterEach(callback: Function): Suite {
        this._onAfterEach = callback;
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
     * Set callback to run after all scenarios complete
     * 
     * @param callback 
     */
    public after(callback: Function): Suite {
        this._onAfterAll = callback;
        return this;
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
    private _onScenarioStatusChange(scenario: Scenario, statusEvent: ScenarioStatusEvent) {
        const suite: Suite = this;
        // This scenario is executing, suite was not previously executing
        if (scenario.hasExecuted() && !this.hasExecuted()) {
            this._timeSuiteExecuted = Date.now();
        }
        // This scenario has finished
        if (statusEvent = ScenarioStatusEvent.finished) {
            // Is every scenario completed? And only run it once
            if (this._haveAllScenariosFinished() && !this.hasFinished()) {
                // All scenarios are done
                this._publish(SuiteStatusEvent.afterAllExecute);
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
                this._publish(SuiteStatusEvent.finished);
                // Should we print automatically?
                if (Flagpole.automaticallyPrintToConsole) {
                    this.print(Flagpole.exitOnDone);
                }
                else {
                    Flagpole.exitOnDone && Flagpole.exit(this.passed());
                }
            }
        }
        // After Execute
        else if (statusEvent == ScenarioStatusEvent.afterExecute) {
            this._onAfterEach(scenario);
            this._publish(SuiteStatusEvent.afterEachExecute);
        }
        // Before Execute
        else if (statusEvent == ScenarioStatusEvent.beforeExecute) {
            if (!this.hasExecuted()) {
                this._publish(SuiteStatusEvent.beforeAllExecute);
            }
            this._onBeforeEach(scenario);
            this._publish(SuiteStatusEvent.beforeEachExecute);
        }
    }
    
    /**
     * PubSub Publish
     * 
     * @param statusEvent 
     */
    protected _publish(statusEvent: SuiteStatusEvent) {
        this._subscribers.forEach((callback: Function) => {
            callback(this, statusEvent);
        });
        if (statusEvent == SuiteStatusEvent.beforeAllExecute) {
            this._onBeforeAll(this);
        }
        else if (statusEvent == SuiteStatusEvent.afterAllExecute) {
            this._onAfterAll(this);
        }
        else if (statusEvent == SuiteStatusEvent.finished) {
            this._onFinally(this);
        }
    }

}
