let request = require('request');
let cheerio = require('cheerio');

interface iRequest {
    select(path: string): Property
    status(): Property
    and(): Property|null
    done(): void
    label(message: string): iRequest
    readonly scenario: Scenario
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

    public wait(bool: boolean = true): Suite {
        this.waitToExecute = bool;
        return this;
    }

    public isDone(): boolean {
        return this.scenarios.every(function(scenario) {
            return scenario.isDone();
        });
    }

    public getDuration(): number {
        return Date.now() - this.start;
    }

    public print() {
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
    }

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

    public getScenarioByTag(tag: string): Scenario {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag][0] : null;
    }

    public getAllScenariosByTag(tag: string): [Scenario] {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag] : [];
    }

    public base(url: string): Suite {
        this.baseUrl = url;
        return this;
    }

    public buildUrl(path: string): string {
        return (!!this.baseUrl) ?
            (this.baseUrl + path) :
            path;
    }

    public execute(): Suite {
        this.scenarios.forEach(function(scenario) {
            scenario.execute();
        });
        return this;
    }

    public passed(): boolean {
        return this.scenarios.every(function(scenario) {
            return scenario.passed();
        });
    }

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

    public failed(): boolean {
        return (this.failures.length > 0);
    }

    public passed(): boolean {
        return !!(this.passes.length > 0 && this.end && this.failures.length == 0);
    }

    public timeout(timeout: number): Scenario {
        this.options.timeout = timeout;
        return this;
    }

    public wait(bool: boolean = true): Scenario {
        this.waitToExecute = bool;
        return this;
    }

    public form(form: any): Scenario {
        this.options.form = form;
        return this;
    }

    public auth(authorization: any): Scenario {
        this.options.auth = authorization;
        return this;
    }

    public headers(headers: any): Scenario {
        this.options.headers = headers;
        return this;
    }

    public type(type: string): Scenario {
        this.pageType = type;
        return this;
    }

    public method(method: string): Scenario {
        this.options.method = method.toUpperCase();
        return this;
    }

    public isDone(): boolean {
        return (this.end !== null);
    }

    public subheading(message: string): Scenario {
        this.log.push(new ConsoleLine(message));
        return this;
    }

    public pass(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new ConsoleLine('  ✔  ' + message, "\x1b[32m"));
        this.passes.push(message);
        return this;
    }

    public fail(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new ConsoleLine('  ✕  ' + message, "\x1b[31m"));
        this.failures.push(message);
        return this;
    }

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
                    (scenario.then !== null) && scenario.then(
                        new requestObject(scenario, scenario.url, Flagpole.toSimplifiedResponse(response, body))
                    );
                }
                else {
                    scenario.fail('Failed to load page ' + scenario.url);
                }
            });

        }
        return this;
    }

    public Scenario(title: string, tags?: [string]): Scenario {
        return this.suite.Scenario(title, tags);
    }

    public label(message: string): Scenario {
        this.nextLabel = message;
        return this;
    }

    public getLog(): Array<ConsoleLine> {
        return this.log;
    }

    protected getExecutionTime(): number {
        return (this.end !== null && this.start !== null) ?
            (this.end - this.start) : 0;
    }

    public done(): Scenario {
        this.end = Date.now();
        this.log.push(new ConsoleLine("  » Took " + this.getExecutionTime() + "ms\n"));
        this.onDone(this);
        return this;
    }

}

/**
 * Various different types of properties that assertions can be made against
 */
class Property {

    protected endPoint: iRequest;
    protected name: string;
    protected obj: any;

    protected flipAssertion: boolean = false;

    constructor(endPoint: iRequest, name: string, obj: any) {
        this.endPoint = endPoint;
        this.name = name;
        this.obj = obj;
    }

    protected assert(statement: boolean): boolean {
        return this.flipAssertion ?
            !statement :
            !!statement;
    }

    protected reset(): iRequest {
        this.flipAssertion = false;
        return this.endPoint;
    }

    public not(): Property {
        this.flipAssertion = true;
        return this;
    }

    public toString(): string {
        return (Flagpole.toType(this.obj) == 'cheerio') ?
            this.obj.text().toString() :
            this.obj.toString();
    }

    public nth(i: number): Property {
        if (Flagpole.toType(this.obj) == 'array') {
            return new Property(this.endPoint, this.name + '[' + i + ']', this.obj[i]);
        }
        else if (Flagpole.toType(this.obj) == 'cheerio') {
            return new Property(this.endPoint, this.name + '[' + i + ']', this.obj.eq(i));
        }
        return new Property(this.endPoint, 'Length of ' + this.name, null)
    }

    public first(): Property {
        if (
            Flagpole.toType(this.obj) == 'array' ||
            Flagpole.toType(this.obj) == 'cheerio'
        ) {
            return this.nth(0);
        }
        return new Property(this.endPoint, 'Length of ' + this.name, null)
    }

    public last(): Property {
        if (
            Flagpole.toType(this.obj) == 'array' ||
            Flagpole.toType(this.obj) == 'cheerio'
        ) {
            return this.nth(this.obj.length - 1);
        }
        return new Property(this.endPoint, 'Length of ' + this.name, null)
    }

    public attribute(key: string): Property {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.attr(key);
        }
        else if (this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Property(this.endPoint,  this.name + '[' + key + ']', text);
    }

    public property(key: string): Property {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Property(this.endPoint,  this.name + '[' + key + ']', text);
    }

    public data(key: string): Property {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Property(this.endPoint,  this.name + '[' + key + ']', text);
    }

    public val(): Property {
        let text: string|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else {
            text = this.toString();
        }
        return new Property(this.endPoint, 'Value of ' + this.name, text);
    }

    public text(): Property {
        let text: string = '';
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.text();
        }
        else {
            text = this.obj.toString();
        }
        return new Property(this.endPoint, 'Text of ' + this.name, text);
    }

    public length(): Property {
        let count: number = this.obj.length;
        return new Property(this.endPoint, 'Length of ' + this.name, count);
    }

    protected pass(message: string) {
        this.endPoint.scenario.pass(
            this.flipAssertion ?
                'NOT: ' + message :
                message
        );
    }

    protected fail(message: string) {
        this.endPoint.scenario.fail(
            this.flipAssertion ?
                'NOT: ' + message :
                message
        );
    }

    public label(message: string): Property {
        this.endPoint.label(message);
        return this;
    }

    /* ASSERTIONS */

    public exists(): iRequest {
        let exists: boolean = (Flagpole.toType(this.obj) == 'cheerio') ?
            (typeof this.obj && this.obj.length) :
            (typeof this.obj !== 'undefined');
        this.assert(exists) ?
            this.pass(this.name + ' exists') :
            this.fail(this.name + ' does not exist');
        return this.reset();
    }

    public hasClass(className: string): iRequest {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            this.assert(this.obj.hasClass(className)) ?
                this.pass(this.name + ' has class ' + className) :
                this.fail(this.name + ' does not have class ' + className);
        }
        return this.reset();
    }

    public greaterThan(value: any): iRequest {
        this.assert(this.obj > value) ?
            this.pass(this.name + ' is greater than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    public lessThan(value: any): iRequest {
        this.assert(this.obj < value) ?
            this.pass(this.name + ' is less than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not less than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    public equals(value: any): iRequest {
        this.assert(this.obj == value) ?
            this.pass(this.name + ' equals ' + value) :
            this.fail(this.name + ' does not equal ' + value + ' (' + this.obj + ')');
        return this.reset();
    }

    public contains(string: string): iRequest {
        let contains: boolean = false;
        if (Flagpole.toType(this.obj) == 'array') {
            contains = (this.obj.toString().indexOf(string) >= 0);
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

    public is(type: string): iRequest {
        let myType: string = Flagpole.toType(this.obj);
        this.assert(myType == type.toLocaleLowerCase()) ?
            this.pass(this.name + ' is type ' + type) :
            this.fail(this.name + ' is not type ' + type + ' (' + myType + ')');
        return this.reset();
    }

}

abstract class GenericRequest  implements iRequest {

    public readonly scenario: Scenario;

    protected url: string;
    protected response: SimplifiedResponse;
    protected body: string|null = null;
    protected last: Property|null = null;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        this.scenario = scenario;
        this.url = url;
        this.response = response;
    }

    public and(): Property|null {
        return this.last;
    }

    public headers(key?: string): Property  {
        if (typeof key !== 'undefined') {
            // Try first as they put it in the test, then try all lowercase
            let value: string = typeof this.response.headers[key] !== 'undefined' ?
                this.response.headers[key] : this.response.headers[key.toLowerCase()];
            return new Property(this, 'HTTP Headers[' + key + ']', value);
        }
        else {
            return new Property(this, 'HTTP Headers', this.response.headers);
        }
    }

    public status(): Property {
        return new Property(this, 'HTTP Status', this.response.statusCode);
    }

    public done() {
        this.scenario.done();
    }

    public label(message: string): iRequest {
        this.scenario.label(message);
        return this;
    }

    abstract select(path: string): Property

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

    public select(path: string): Property {
        let args: Array<string> = path.split('.');
        let obj: any = this.json;
        let endPoint: iRequest = this;
        if (args.every(function(value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
            this.last =  new Property(endPoint, path, obj);
        }
        else {
            this.last =  new Property(endPoint, path, undefined);
        }
        return this.last;
    }

}

class HtmlRequest extends GenericRequest {

    private $;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.$ = cheerio.load(response.body);
    }

    public select(selector: string): Property {
        let obj: any = this.$(selector);
        this.last =  new Property(this, selector, obj);
        return this.last;
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

    static toType(obj): string {
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

