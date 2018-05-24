import {isNumber} from "util";

let request = require('request');
let cheerio = require('cheerio');

interface iResponse {
    select(path: string, findIn?: any): Element
    status(): Value
    and(): Element
    done(): iResponse
    label(message: string): iResponse
    lastElement(property?: Element): Element
    readonly scenario: Scenario
}

interface iProperty {

}

export interface SimplifiedResponse {
    statusCode: number
    body: string
    headers: Array<any>
}

/**
 * A suite contains many scenarios
 */
export class Suite {

    public scenarios: Array<Scenario> = [];

    protected title: string;
    protected baseUrl: string|null = null;
    protected start: number;
    protected waitToExecute: boolean = false;
    protected byTag: any = {};

    constructor(title: string) {
        this.title = title;
        this.start = Date.now();
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
        return this.scenarios.every(function(scenario) {
            return scenario.isDone();
        });
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
        Flagpole.message('» Environment: ' + process.env.ENVIRONMENT);
        Flagpole.message('» Took ' + this.getDuration() + "ms\n");

        let color: string = this.passed() ? "\x1b[32m" : "\x1b[31m";
        Flagpole.message('» Passed? ' + (this.passed() ? 'Yes' : 'No') + "\n", color);

        this.scenarios.forEach(function(scenario) {
            scenario.getLog().forEach(function(line) {
                line.write();
            });
        });
        return this;
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
                suite.print();
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
        this.baseUrl = url;
        return this;
    }

    /**
     * Used by scenario to build its url
     *
     * @param {string} path
     * @returns {string}
     */
    public buildUrl(path: string): string {
        return (!!this.baseUrl) ?
            (this.baseUrl + path) :
            path;
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
        return !!(this.passes.length > 0 && this.end && this.failures.length == 0);
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
        this.log.push(new ConsoleLine('  ✔  ' + message, "\x1b[32m"));
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
        this.log.push(new ConsoleLine('  ✕  ' + message, "\x1b[31m"));
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

/**
 * Generic property that is selected. It could be an element or a value
 */
abstract class Property implements iProperty {

    protected response: iResponse;
    protected name: string;
    protected obj: any;
    protected flipAssertion: boolean = false;

    constructor(response: iResponse, name: string, obj: any) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }

    /**
     * Sometimes we need to get the actual string
     *
     * @returns {string}
     */
    public toString(): string {
        return (Flagpole.toType(this.obj) == 'cheerio') ?
            this.obj.text().toString() :
            this.obj.toString();
    }

    /**
     * Assert something is true, with respect to the flipped not()
     *
     * @param {boolean} statement
     * @returns {boolean}
     */
    protected assert(statement: boolean): boolean {
        return this.flipAssertion ? !statement : !!statement;
    }

    /**
     * Clear out any previous settings
     *
     * @returns {iResponse}
     */
    protected reset(): iResponse {
        this.flipAssertion = false;
        return this.response;
    }

    /**
     * Flip the next assertion
     *
     * @returns {iProperty}
     */
    public not(): iProperty {
        this.flipAssertion = true;
        return this;
    }

    /**
     * Get the text value of this object
     *
     * @returns {Value}
     */
    public text(): Value {
        let text: string = '';
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.text();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, text);
    }

    /**
     * Write a message for a passing assertion
     *
     * @param {string} message
     */
    protected pass(message: string): Scenario {
        return this.response.scenario.pass(
            this.flipAssertion ?
                'NOT: ' + message :
                message
        );
    }

    /**
     * Write message for a failing assertion
     *
     * @param {string} message
     */
    protected fail(message: string): Scenario {
        return this.response.scenario.fail(
            this.flipAssertion ?
                'NOT: ' + message :
                message
        );
    }

    /**
     * Override the default message for this test so we can have a custom message that is more human readable
     *
     * @param {string} message
     * @returns {iProperty}
     */
    public label(message: string): iProperty {
        this.response.label(message);
        return this;
    }

    /**
     * Find the number of elements in array or length of a string
     *
     * @returns {Value}
     */
    public length(): Value {
        let count: number = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Value(this.response, 'Length of ' + this.name, count);
    }

    /**
     * Does this object contain this? Works for strings, arrays, and objects alike
     *
     * @param {string} string
     * @returns {iResponse}
     */
    public contains(string: string): iResponse {
        let contains: boolean = false;
        if (Flagpole.toType(this.obj) == 'array') {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            contains = (this.obj.hasOwnProperty(string));
        }
        else {
            contains = (this.obj.toString().indexOf(string) >= 0);
        }
        this.assert(contains) ?
            this.pass(this.name + ' contains ' + string) :
            this.fail(this.name + ' does not contain ' + string);
        return this.reset();
    }

    /**
     * Does this objects type match this?
     *
     * @param {string} type
     * @returns {iResponse}
     */
    public is(type: string): iResponse {
        let myType: string = Flagpole.toType(this.obj);
        this.assert(myType == type.toLocaleLowerCase()) ?
            this.pass(this.name + ' is type ' + type) :
            this.fail(this.name + ' is not type ' + type + ' (' + myType + ')');
        return this.reset();
    }

    /**
     * For debugging, just spit out a value
     *
     * @returns {iResponse}
     */
    public echo(): iResponse {
        this.pass(this.name + ' = ' + this.obj);
        return this.reset();
    }

    /**
     * For debugging, just spit out this object's type
     *
     * @returns {iResponse}
     */
    public typeof(): iResponse {
        this.pass('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this.reset();
    }

    /**
     * Loop through it
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public each(callback: Function): iResponse {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            // Not working right yet
            let name: string = this.name;
            let response: iResponse = this.response;
            this.obj.each(function(el, index) {
                callback(new Element(response, name + '[' + index + ']', el));
            });
        }
        else if (Flagpole.toType(this.obj) == 'array') {
            this.obj.forEach(callback);
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            this.obj.keys().forEach(callback);
        }
        else if (Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().split(' ').forEach(callback);
        }
        return this.response;
    }

}

class Value extends Property implements iProperty {

    /**
     * Is this object's value greater than this?
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThan(value: number): iResponse {
        this.assert(this.obj > value) ?
            this.pass(this.name + ' is greater than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    /**
     *  Is this object's value greater than or equal to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public greaterThanOrEquals(value: any): iResponse {
        this.assert(this.obj >= value) ?
            this.pass(this.name + ' is greater than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    /**
     * Is this object's value less than this?
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThan(value: number): iResponse {
        this.assert(this.obj < value) ?
            this.pass(this.name + ' is less than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not less than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    /**
     * Is this object's value less or equal to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public lessThanOrEquals(value: any): iResponse {
        this.assert(this.obj <= value) ?
            this.pass(this.name + ' is less than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not less than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    /**
     *  Is this object's value equal to this?
     *
     * @param value
     * @param {boolean} permissiveMatching
     * @returns {iResponse}
     */
    public equals(value: any, permissiveMatching: boolean = false): iResponse {
        let matchValue: string = String(this.obj);
        let positiveCase: string = 'equals';
        let negativeCase: string = 'does not equal';
        if (permissiveMatching) {
            value = value.toLowerCase().trim();
            matchValue = matchValue.toLowerCase().trim();
            positiveCase = 'is similar to';
            negativeCase = 'is not similar to';
        }
        this.assert(matchValue == value) ?
            this.pass(this.name + ' ' + positiveCase + ' ' + value) :
            this.fail(this.name + ' ' + negativeCase + ' ' + value + ' (' + matchValue + ')');
        return this.reset();
    }

    /**
     * Is this object's value similar to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public similarTo(value: any): iResponse {
        return this.equals(value, true);
    }

}

/**
 * Various different types of properties that assertions can be made against
 */
class Element extends Property implements iProperty {

    /**
     * Just mapping this to response.and() to facilitate chaining
     *
     * @returns {Element}
     */
    public and(): Element {
        return this.response.and();
    }

    /**
     * Click on this link (kick off another scenario)
     *
     * @param {Scenario} nextScenario
     * @returns {Element}
     */
    public click(nextScenario: Scenario): Element {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            let href: string = this.attribute('href').toString();
            // Need more logic here to handle relative links
            if (!nextScenario.isDone()) {
                nextScenario.open(href).execute();
            }
        }
        return this;
    }

    /**
     * Find a child element of the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public find(selector: string): Element {
        return this.response.select(selector, this.obj);
    }

    /**
     * Find the next element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public next(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.next(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find the previous element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public prev(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.prev(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Going up the object model, find the closest matching element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public closest(selector: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.closest(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find a matching parent element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public parents(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.parents(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find matching sibling elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public siblings(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.siblings(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find matching child elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public children(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.children(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Alias for nth because it's what jQuery uses even though it's a stupid name
     *
     * @param {number} i
     * @returns {Element}
     */
    public eq(i: number): Element {
        return this.nth(i);
    }

    /**
     * Select the nth value or an array or collection
     *
     * @param {number} i
     * @returns {Element}
     */
    public nth(i: number): Element {
        let obj: any = null;
        if (i >= 0) {
            if (Flagpole.toType(this.obj) == 'array') {
                obj = this.obj[i];
            }
            else if (Flagpole.toType(this.obj) == 'cheerio') {
                obj = this.obj.eq(i);
            }
        }
        return this.response.lastElement(new Element(this.response, this.name + '[' + i + ']', obj));
    }

    /**
     * Get the first element in the array
     *
     * @returns {Element}
     */
    public first(): Element {
        return this.nth(0);
    }

    /**
     * Get the last element in the array
     *
     * @returns {Element}
     */
    public last(): Element {
        return this.nth(
            (this.obj && this.obj.length) ? (this.obj.length - 1) : -1
        );
    }

    /**
     * Get the attribute by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public attribute(key: string): Value {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.attr(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the property by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public property(key: string): Value {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the data attribute by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public data(key: string): Value {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the value of this object
     *
     * @returns {Value}
     */
    public val(): Value {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return new Value(this.response, 'Value of ' + this.name, text);
    }

    /**
     * Get the integer value of this object
     *
     * @returns {Value}
     */
    public parseInt(): Value {
        let num: number|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseInt(this.obj.text());
        }
        else {
            num = parseInt(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }

    /**
     * Get the float/double value of this object
     *
     * @returns {Value}
     */
    public parseFloat(): Value {
        let num: number|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseFloat(this.obj.text());
        }
        else {
            num = parseFloat(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }

    /* ASSERTIONS */

    /**
     * Does this element exist?
     *
     * @returns {iResponse}
     */
    public exists(): iResponse {
        let exists: boolean = false;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            exists = (this.obj.length > 0);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            exists = true;
        }
        this.assert(exists) ?
            this.pass(this.name + ' exists') :
            this.fail(this.name + ' does not exist');
        return this.reset();
    }

    /**
     * Does this element have this class name?
     *
     * @param {string} className
     * @returns {iResponse}
     */
    public hasClass(className: string): iResponse {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            this.assert(this.obj.hasClass(className)) ?
                this.pass(this.name + ' has class ' + className) :
                this.fail(this.name + ' does not have class ' + className);
        }
        return this.reset();
    }

}

abstract class GenericRequest  implements iResponse {

    public readonly scenario: Scenario;

    protected url: string;
    protected response: SimplifiedResponse;

    private last: Element|null = null;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        this.scenario = scenario;
        this.url = url;
        this.response = response;
    }

    public lastElement(property?: Element): Element {
        if (typeof property == 'undefined') {
            return this.last || new Element(this, 'Empty Element', []);
        }
        else {
            this.last = property;
            return property;
        }
    }

    public and(): Element {
        return this.last || new Element(this, 'Empty Element', []);
    }

    public headers(key?: string): Value  {
        if (typeof key !== 'undefined') {
            // Try first as they put it in the test, then try all lowercase
            let value: string = typeof this.response.headers[key] !== 'undefined' ?
                this.response.headers[key] : this.response.headers[key.toLowerCase()];
            return new Value(this, 'HTTP Headers[' + key + ']', value);
        }
        else {
            return new Value(this, 'HTTP Headers', this.response.headers);
        }
    }

    public status(): Value {
        return new Value(this, 'HTTP Status', this.response.statusCode);
    }

    public done(): iResponse {
        this.scenario.done();
        return this;
    }

    public label(message: string): iResponse {
        this.scenario.label(message);
        return this;
    }

    abstract select(path: string): Element

}

class JsonRequest extends GenericRequest {

    protected json: {};

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }

    public select(path: string, findIn?: any): Element {
        let args: Array<string> = path.split('.');
        let obj: any = findIn || this.json;
        let response: iResponse = this;
        let element: Element;
        if (args.every(function(value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
            element = new Element(response, path, obj);
        }
        else {
            element = new Element(response, path, undefined);
        }
        this.lastElement(element);
        return element;
    }

}

class HtmlRequest extends GenericRequest {

    private $;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.$ = cheerio.load(response.body);
    }

    public select(selector: string, findIn?: any): Element {
        let obj: any = null;
        // If findIn is a cheerio object, then look in it
        if (Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(selector);
        }
        // Otheriwse use top level context
        else {
            obj = this.$(selector);
        }
        // Create the property
        let element: Element = new Element(this, selector, obj);
        this.lastElement(element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

}

export class ConsoleLine {

    public color: string = '\x1b[0m';
    public message: string = '';

    constructor(message: string, color?: string) {
        this.message = message;
        this.color = color || this.color;
    }

    public write() {
        console.log(this.color, this.message, '\x1b[0m');
    }

}


export class Flagpole {

    static Suite(title: string): Suite {
        return new Suite(title);
    }

    static heading(message: string) {
        let length: number = Math.max(message.length + 10, 50),
            padding: number = (length - message.length) / 2;
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
        new ConsoleLine(' '.repeat(padding) + message.toLocaleUpperCase() + ' '.repeat(padding), "\x1b[33m").write();
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
    }

    static message(message: string, color?: string) {
        new ConsoleLine(message, color).write();
    }

    static toSimplifiedResponse(response, body): SimplifiedResponse {
        return {
            statusCode: response.statusCode,
            body: body,
            headers: response.headers,
        };
    }

    static isNullOrUndefined(obj: any): boolean {
        return (typeof obj === "undefined" || obj === null);
    }

    static toType(obj: any): string {
        if (typeof obj === "undefined") {
            return 'undefined';
        }
        else if (obj === null) {
            return 'null';
        }
        else if (obj instanceof cheerio) {
            return 'cheerio';
        }
        else if (obj && obj.constructor && obj.constructor.name) {
            return obj.constructor.name.toLocaleLowerCase();
        }
        else if (obj && obj.constructor && obj.constructor.toString) {
            let arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return arr[1].toLocaleLowerCase();
            }
        }
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLocaleLowerCase();
    }

}

