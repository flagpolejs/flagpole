import { Flagpole } from "./index";
import { ResponseType } from "./response";
import { Scenario } from "./scenario";
import { URL } from 'url';
import { FlagpoleReport } from './flagpolereport';
import * as Bluebird from "bluebird";

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

    private _homeScore: number = 0;

    public get baseUrl(): URL | null {
        return this._baseUrl;
    }

    /**
     * Did every scenario in this suite pass?
     */
    public get hasPassed(): boolean {
        return this.scenarios.every(function (scenario) {
            return scenario.hasPassed;
        });
    }

    /**
     * Did any scenario in this suite fail?
     */
    public get hasFailed(): boolean {
        return this.scenarios.some(function (scenario) {
            return scenario.hasFailed;
        });
    }

    /**
     * Did this suite start running yet?
     */
    public get hasExecuted(): boolean {
        return this._timeSuiteExecuted !== null;
    }

    /**
     * Has this suite finished running?
     */
    public get hasFinished(): boolean {
        return this._timeSuiteFinished !== null;
    }

    /**
     * Total duration in milliseconds from initialization to completion
     */
    public get totalDuration(): number | null {
        return this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteInitialized) : null;
    }

    /**
     * Duration in milliseconds between execution start and completion
     */
    public get executionDuration(): number | null {
        return this._timeSuiteExecuted !== null && this._timeSuiteFinished !== null ?
            (this._timeSuiteFinished - this._timeSuiteExecuted) : null;
    }

    public get title(): string {
        return this._title;
    }

    protected _subscribers: Function[] = [];
    protected _errorCallbacks: Function[] = [];
    protected _successCallbacks: Function[] = [];
    protected _failureCallbacks: Function[] = [];
    protected _finallyCallbacks: Function[] = [];
    protected _beforeAllCallbacks: Function[] = [];
    protected _afterAllCallbacks: Function[] = [];
    protected _beforeEachCallbacks: Function[] = [];
    protected _afterEachCallbacks: Function[] = [];
    protected _beforeAllPromise: Promise<void>;
    protected _beforeAllResolver: Function = () => { };
    protected _title: string;
    protected _baseUrl: URL | null = null;
    protected _timeSuiteInitialized: number = Date.now();
    protected _timeSuiteExecuted: number | null = null;
    protected _timeSuiteFinished: number | null = null;
    protected _waitToExecute: boolean = false;
    protected _verifySslCert: boolean = true;

    constructor(title: string) {
        this._title = title;
        this._beforeAllPromise = new Promise((resolve) => {
            this._beforeAllResolver = resolve;
        });
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
     * Turn on or off SSL verification for any new scenarios added to suite
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
     * Print all logs to console
     *
     * @returns {Suite}
     */
    public print(exitAfterPrint: boolean = true): void {
        const report: FlagpoleReport = new FlagpoleReport(this);
        report.print()
            .then(() => {
                exitAfterPrint && Flagpole.exit(this.hasPassed)
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
    public scenario(title: string, type: ResponseType, opts: any): Scenario {
        const scenario: Scenario = Scenario.create(
            this, title, type, opts, 
            (scenario: Scenario) => {
                return this._onAfterScenarioFinished(scenario);
            }
        )
        // Notify suite on any changes to scenario
        scenario.before((scenario: Scenario) => {
            return this._onBeforeScenarioExecutes(scenario);
        });
        scenario.after((scenario: Scenario) => {
            return this._onAfterScenarioExecutes(scenario);
        });
        scenario.error((errorMessage: string) => {
            return this._fireError(errorMessage);
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
    public json(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.json, opts);
    }

    /**
     * Create a new Image Scenario
     */
    public image(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.image, opts);
    }

    /**
     * Create a new Video Scenario
     */
    public video(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.video, opts);
    }

    /**
     * Create a new HTML/DOM Scenario
     */
    public html(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.html, opts);
    }

    /**
     * Create a new CSS Scenario
     */
    public stylesheet(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.stylesheet, opts);
    }

    /**
     * Create a new Script Scenario
     */
    public script(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.script, opts);
    }

    /**
     * Create a generic resource scenario
     */
    public resource(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.resource, opts);
    }

    /**
     * Create a Browser/Puppeteer Scenario
     */
    public browser(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.browser, opts);
    }

    /**
     * Create an ExtJS Scenario
     */
    public extjs(title: string, opts: any = {}): Scenario {
        return this.scenario(title, ResponseType.extjs, opts);
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
        if (this.hasExecuted) {
            throw new Error(`Suite already executed.`)
        }
        this._timeSuiteExecuted = Date.now();
        this.scenarios.forEach(function(scenario) {
            scenario.execute();
        });
        return this;
    }

    /**
     * This callback will run right before the first scenario starts to execute
     * 
     * @param callback 
     */
    public beforeAll(callback: Function): Suite {
        this._beforeAllCallbacks.push(callback);
        return this;
    }

    /**
     * Set callback that will run before each Scenario starts executing
     * 
     * @param callback 
     */
    public beforeEach(callback: Function): Suite {
        this._beforeEachCallbacks.push(callback);
        return this;
    }

    /**
     * Set callback that will run after each Scenario completes execution
     * 
     * @param callback 
     */
    public afterEach(callback: Function): Suite {
        this._afterEachCallbacks.push(callback);
        return this;
    }

    /**
     * Set callback to run after all scenarios complete
     * 
     * @param callback 
     */
    public afterAll(callback: Function): Suite {
        this._afterAllCallbacks.push(callback);
        return this;
    }

    /**
     * This callback runs once the suite is done, if it errored
     * 
     * @param callback 
     */
    public catch(callback: Function): Suite {
        this._errorCallbacks.push(callback);
        return this;
    }

    /**
     * This callback runs once the suite is done, if it passed
     * 
     * @param callback 
     */
    public success(callback: Function): Suite {
        this._successCallbacks.push(callback);
        return this;
    }

    /** 
     * This callback runs once the suite is done, if it failed
     */
    public failure(callback: Function): Suite {
        this._failureCallbacks.push(callback);
        return this;
    }

    /**
     * This callback will run once everything else is completed, whether pass or fail
     */
    public finally(callback: Function): Suite {
        this._finallyCallbacks.push(callback);
        return this;
    }

    /**
    * Have all of the scenarios in this suite completed?
    */
    private _haveAllScenariosFinished(): boolean {
        return this.scenarios.every(function (scenario) {
            return scenario.hasFinished;
        });
    }

    private _fireBeforeAll(): Promise<void> {
        const suite: Suite = this;
        this._timeSuiteExecuted = Date.now();
        return new Promise((resolve, reject) => {
            Bluebird.mapSeries(this._beforeAllCallbacks, (_then) => {
                return _then(suite);
            }).then(() => {
                this._publish(SuiteStatusEvent.beforeAllExecute);
                this._beforeAllResolver();
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireBeforeEach(scenario: Scenario): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._beforeEachCallbacks, (_then) => {
                return _then.apply(suite, [scenario]);
            }).then(() => {
                this._publish(SuiteStatusEvent.beforeEachExecute);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireAfterEach(scenario: Scenario): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._afterEachCallbacks, (_then) => {
                return _then.apply(suite, [scenario]);
            }).then(() => {
                this._publish(SuiteStatusEvent.afterEachExecute);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireAfterAll(): Promise<void> {
        const suite: Suite = this;
        this._timeSuiteFinished = Date.now();
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._afterAllCallbacks, (_then) => {
                return _then.apply(suite, [suite]);
            }).then(() => {
                this._publish(SuiteStatusEvent.afterAllExecute);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireSuccess(): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._successCallbacks, (_then) => {
                return _then.apply(suite, [suite]);
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireFailure(): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._failureCallbacks, (_then) => {
                return _then.apply(suite, [suite]);
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireError(errorMessage: string): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._errorCallbacks, (_then) => {
                return _then.apply(suite, [errorMessage]);
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private _fireFinally(): Promise<void> {
        const suite: Suite = this;
        return new Promise((resolve, reject) => {
            Bluebird.mapSeries(this._finallyCallbacks, (_then) => {
                return _then.apply(suite, [suite]);
            }).then(() => {
                this._publish(SuiteStatusEvent.finished);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    private async _onBeforeScenarioExecutes(scenario: Scenario): Promise<Scenario> {
        // This scenario is executing, suite was not previously executing
        if (scenario.hasExecuted && !this.hasExecuted) {
            await this._fireBeforeAll();
        }
        await this._beforeAllResolved();
        await this._fireBeforeEach(scenario);
        return scenario;
    }

    private async _onAfterScenarioExecutes(scenario: Scenario): Promise<Scenario> {
        await this._fireAfterEach(scenario);
        return scenario;
    }

    private async _onAfterScenarioFinished(scenario: Scenario): Promise<void> {
        // Is every scenario completed? And only run it once
        if (this._haveAllScenariosFinished() && !this.hasFinished) {
            await this._fireAfterAll();
            // Success or failure?
            this.hasPassed ?
                await this._fireSuccess() :
                await this._fireFailure();
            // All Done
            await this._fireFinally();
            // Should we print automatically?
            if (Flagpole.automaticallyPrintToConsole) {
                this.print(Flagpole.exitOnDone);
            }
            else {
                Flagpole.exitOnDone && Flagpole.exit(this.hasPassed);
            }
        }
    }

    protected async _beforeAllResolved(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._beforeAllPromise.then(() => {
                resolve(true);
            })
            .catch((ex) => {
                reject(ex);
            });
        });
    }

    protected _publish(statusEvent: SuiteStatusEvent) {
        this._subscribers.forEach((callback: Function) => {
            callback(this, statusEvent);
        });
    }

}
