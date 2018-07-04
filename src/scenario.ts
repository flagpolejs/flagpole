import { Flagpole } from "./index";
import { Suite } from "./suite";
import { ConsoleLine } from "./consoleline";
import { JsonRequest } from "./jsonrequest";
import { HtmlRequest } from "./htmlrequest";

let request = require('request');

/**
 * A scenario contains tests that run against one request
 */
export class Scenario {

    public readonly suite: Suite;

    protected title: string;
    protected log: Array<ConsoleLine> = [];
    protected failures: Array<string> = [];
    protected passes: Array<string> = [];
    protected onDone: Function;
    protected initialized: number|null = null;
    protected start: number|null = null;
    protected end: number|null = null;
    protected pageType: string = 'html';
    protected then: Function|null = null;
    protected url: string|null = null;
    protected waitToExecute: boolean = false;
    protected nextLabel: string|null = null;

    protected options: any = {
        method: 'GET'
    };

    constructor(suite: Suite, title: string, onDone: Function) {
        this.initialized = Date.now();
        this.suite = suite;
        this.title = title;
        this.onDone = onDone;
        this.subheading(title);
    }

    /**
     * Did any assertions in this scenario fail?
     *
     * @returns {boolean}
     */
    public failed(): boolean {
        return (this.failures.length > 0);
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     *
     * @returns {boolean}
     */
    public passed(): boolean {
        return !!(this.end && this.failures.length == 0);
    }

    /**
     * Set the timeout for how long the request should wait for a response
     *
     * @param {number} timeout
     * @returns {Scenario}
     */
    public timeout(timeout: number): Scenario {
        this.options.timeout = timeout;
        return this;
    }

    /**
     * Do not run this scenario until execute() is called
     *
     * @param {boolean} bool
     * @returns {Scenario}
     */
    public wait(bool: boolean = true): Scenario {
        this.waitToExecute = bool;
        return this;
    }

    /**
     * Set the form options that will be submitted with the request
     *
     * @param form
     * @returns {Scenario}
     */
    public form(form: {}): Scenario {
        this.options.form = form;
        return this;
    }

    /**
     * Set the basic authentication headers to be sent with this request
     *
     * @param authorization
     * @returns {Scenario}
     */
    public auth(authorization: any): Scenario {
        this.options.auth = authorization;
        return this;
    }

    /**
     * Set the full list of headers to submit with this request
     *
     * @param headers
     * @returns {Scenario}
     */
    public headers(headers: {}): Scenario {
        this.options.headers = headers;
        return this;
    }

    /**
     * Set a single header key-value without overriding others
     *
     * @param {string} key
     * @param value
     * @returns {Scenario}
     */
    public header(key: string, value: any): Scenario {
        this.options.headers = this.options.headers || {};
        this.options.headers[key] = value;
        return this;
    }

    /**
     * Set the type of request this is. Default is "html" but you can set this to "json" for REST APIs
     *
     * @param {string} type
     * @returns {Scenario}
     */
    public type(type: string): Scenario {
        this.pageType = type;
        return this;
    }

    /**
     * Set the HTTP method of this request
     *
     * @param {string} method
     * @returns {Scenario}
     */
    public method(method: string): Scenario {
        this.options.method = method.toUpperCase();
        return this;
    }

    /**
     * Has this scenario completed?
     *
     * @returns {boolean}
     */
    public isDone(): boolean {
        return (this.end !== null);
    }

    /**
     * Add a subheading log message to buffer
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public subheading(message: string): Scenario {
        this.log.push(new ConsoleLine(message));
        return this;
    }

    public comment(message: string): Scenario {
        this.log.push(
            ConsoleLine.comment('  »  ' + message)
        );
        this.passes.push(message);
        return this;
    }

    /**
     * Push in a new passing assertion
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public pass(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(ConsoleLine.pass('  ✔  ' + message));
        this.passes.push(message);
        return this;
    }

    /**
     * Push in a new failing assertion
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public fail(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(ConsoleLine.fail('  ✕  ' + message));
        this.failures.push(message);
        return this;
    }

    /**
     * Set the URL that this scenario will hit
     *
     * @param {string} url
     * @returns {Scenario}
     */
    public open(url: string): Scenario {
        // You can only load the url once per scenario
        if (!this.start) {
            this.url = url;
            if (!this.waitToExecute && this.then) {
                this.execute();
            }
        }
        return this;
    }

    /**
     * Set the callback for the assertions to run after the request has a response
     *
     * @param {Function} then
     * @returns {Scenario}
     */
    public assertions(then: Function): Scenario {
        // You can only load the url once per scenario
        if (!this.start) {
            this.then = then;
            if (!this.waitToExecute && this.url) {
                this.execute();
            }
        }
        return this;
    }

    /**
     * Skip this scenario completely and mark it done
     *
     * @returns {Scenario}
     */
    public skip(): Scenario {
        if (!this.start) {
            this.start = Date.now();
            this.log.push(new ConsoleLine("  »  Skipped\n"));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }

    /**
     * Execute this scenario
     *
     * @returns {Scenario}
     */
    public execute(): Scenario {
        let scenario: Scenario = this;
        if (!this.start && this.url !== null) {
            this.start = Date.now();
            this.options.uri = this.suite.buildUrl(this.url);
            // If we waited first
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new ConsoleLine('  »  Waited ' + (this.start - this.initialized) + 'ms'));
            }
            // Execute it
            let requestObject;
            let pageType: string = 'HTML Page';

            if (this.pageType == 'json') {
                pageType = 'REST End Point'
                requestObject = JsonRequest;
            }
            else {
                requestObject = HtmlRequest;
            }
            request(this.options, function(error, response, body) {
                if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                    scenario.pass('Loaded ' + pageType + ' ' + scenario.url);
                    if (scenario.then !== null) {
                        scenario.then(
                            new requestObject(scenario, scenario.url, Flagpole.toSimplifiedResponse(response, body))
                        );
                    }
                    scenario.done();
                }
                else {
                    scenario.fail('Failed to load page ' + scenario.url);
                }
            });

        }
        return this;
    }

    /**
     * Add a new scenario to the parent suite... this facilitates chaining
     *
     * @param {string} title
     * @param {[string]} tags
     * @returns {Scenario}
     * @constructor
     */
    public Scenario(title: string, tags?: [string]): Scenario {
        return this.suite.Scenario(title, tags);
    }

    /**
     * Override the next test's default pass/fail message with something custom and more human readable
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public label(message: string): Scenario {
        this.nextLabel = message;
        return this;
    }

    /**
     * Get the log buffer
     *
     * @returns {Array<ConsoleLine>}
     */
    public getLog(): Array<ConsoleLine> {
        return this.log;
    }

    /**
     * Find the total execution time of this scenario
     *
     * @returns {number}
     */
    protected getExecutionTime(): number {
        return (this.end !== null && this.start !== null) ?
            (this.end - this.start) : 0;
    }

    /**
     * Mark this scenario as completed
     *
     * @returns {Scenario}
     */
    public done(): Scenario {
        this.end = Date.now();
        this.log.push(new ConsoleLine("  » Took " + this.getExecutionTime() + "ms\n"));
        this.onDone(this);
        return this;
    }

}