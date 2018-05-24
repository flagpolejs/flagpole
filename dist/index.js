"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let request = require('request');
let cheerio = require('cheerio');
class Suite {
    constructor(title) {
        this.scenarios = [];
        this.baseUrl = null;
        this.waitToExecute = false;
        this.byTag = {};
        this.title = title;
        this.start = Date.now();
    }
    wait(bool = true) {
        this.waitToExecute = bool;
        return this;
    }
    isDone() {
        return this.scenarios.every(function (scenario) {
            return scenario.isDone();
        });
    }
    getDuration() {
        return Date.now() - this.start;
    }
    print() {
        Flagpole.heading(this.title);
        Flagpole.message('» Base URL: ' + this.baseUrl);
        Flagpole.message('» Environment: ' + process.env.ENVIRONMENT);
        Flagpole.message('» Took ' + this.getDuration() + "ms\n");
        let color = this.passed() ? "\x1b[32m" : "\x1b[31m";
        Flagpole.message('» Passed? ' + (this.passed() ? 'Yes' : 'No') + "\n", color);
        this.scenarios.forEach(function (scenario) {
            scenario.getLog().forEach(function (line) {
                line.write();
            });
        });
        return this;
    }
    Scenario(title, tags) {
        let suite = this;
        let scenario = new Scenario(this, title, function () {
            if (suite.isDone()) {
                suite.print();
            }
        });
        if (this.waitToExecute) {
            scenario.wait();
        }
        if (typeof tags !== 'undefined') {
            tags.forEach(function (tag) {
                suite.byTag.hasOwnProperty(tag) ?
                    suite.byTag[tag].push(scenario) :
                    (suite.byTag[tag] = [scenario]);
            });
        }
        this.scenarios.push(scenario);
        return scenario;
    }
    getScenarioByTag(tag) {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag][0] : null;
    }
    getAllScenariosByTag(tag) {
        return this.byTag.hasOwnProperty(tag) ?
            this.byTag[tag] : [];
    }
    base(url) {
        this.baseUrl = url;
        return this;
    }
    buildUrl(path) {
        return (!!this.baseUrl) ?
            (this.baseUrl + path) :
            path;
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
class Scenario {
    constructor(suite, title, onDone) {
        this.log = [];
        this.failures = [];
        this.passes = [];
        this.initialized = null;
        this.start = null;
        this.end = null;
        this.pageType = 'html';
        this.then = null;
        this.url = null;
        this.waitToExecute = false;
        this.nextLabel = null;
        this.options = {
            method: 'GET'
        };
        this.initialized = Date.now();
        this.suite = suite;
        this.title = title;
        this.onDone = onDone;
        this.subheading(title);
    }
    failed() {
        return (this.failures.length > 0);
    }
    passed() {
        return !!(this.passes.length > 0 && this.end && this.failures.length == 0);
    }
    timeout(timeout) {
        this.options.timeout = timeout;
        return this;
    }
    wait(bool = true) {
        this.waitToExecute = bool;
        return this;
    }
    form(form) {
        this.options.form = form;
        return this;
    }
    auth(authorization) {
        this.options.auth = authorization;
        return this;
    }
    headers(headers) {
        this.options.headers = headers;
        return this;
    }
    header(key, value) {
        this.options.headers = this.options.headers || {};
        this.options.headers[key] = value;
        return this;
    }
    type(type) {
        this.pageType = type;
        return this;
    }
    method(method) {
        this.options.method = method.toUpperCase();
        return this;
    }
    isDone() {
        return (this.end !== null);
    }
    subheading(message) {
        this.log.push(new ConsoleLine(message));
        return this;
    }
    pass(message) {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new ConsoleLine('  ✔  ' + message, "\x1b[32m"));
        this.passes.push(message);
        return this;
    }
    fail(message) {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new ConsoleLine('  ✕  ' + message, "\x1b[31m"));
        this.failures.push(message);
        return this;
    }
    open(url) {
        if (!this.start) {
            this.url = url;
            if (!this.waitToExecute && this.then) {
                this.execute();
            }
        }
        return this;
    }
    assertions(then) {
        if (!this.start) {
            this.then = then;
            if (!this.waitToExecute && this.url) {
                this.execute();
            }
        }
        return this;
    }
    skip() {
        if (!this.start) {
            this.start = Date.now();
            this.log.push(new ConsoleLine("  »  Skipped\n"));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }
    execute() {
        let scenario = this;
        if (!this.start && this.url !== null) {
            this.start = Date.now();
            this.options.uri = this.suite.buildUrl(this.url);
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new ConsoleLine('  »  Waited ' + (this.start - this.initialized) + 'ms'));
            }
            let requestObject;
            let pageType = 'HTML Page';
            if (this.pageType == 'json') {
                pageType = 'REST End Point';
                requestObject = JsonRequest;
            }
            else {
                requestObject = HtmlRequest;
            }
            request(this.options, function (error, response, body) {
                if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                    scenario.pass('Loaded ' + pageType + ' ' + scenario.url);
                    (scenario.then !== null) && scenario.then(new requestObject(scenario, scenario.url, Flagpole.toSimplifiedResponse(response, body)));
                }
                else {
                    scenario.fail('Failed to load page ' + scenario.url);
                }
            });
        }
        return this;
    }
    Scenario(title, tags) {
        return this.suite.Scenario(title, tags);
    }
    label(message) {
        this.nextLabel = message;
        return this;
    }
    getLog() {
        return this.log;
    }
    getExecutionTime() {
        return (this.end !== null && this.start !== null) ?
            (this.end - this.start) : 0;
    }
    done() {
        this.end = Date.now();
        this.log.push(new ConsoleLine("  » Took " + this.getExecutionTime() + "ms\n"));
        this.onDone(this);
        return this;
    }
}
exports.Scenario = Scenario;
class Property {
    constructor(response, name, obj) {
        this.flipAssertion = false;
        this.response = response;
        this.name = name;
        this.obj = obj;
    }
    assert(statement) {
        return this.flipAssertion ? !statement : !!statement;
    }
    reset() {
        this.flipAssertion = false;
        return this.response;
    }
    not() {
        this.flipAssertion = true;
        return this;
    }
    find(selector) {
        return this.response.select(selector, this.obj);
    }
    next(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.next(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    prev(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.prev(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    closest(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.closest(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    parents(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.parents(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    siblings(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.siblings(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    children(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.children(selector);
        }
        return this.response.property(new Property(this.response, name, obj));
    }
    eq(i) {
        return this.nth(i);
    }
    nth(i) {
        let obj = null;
        if (i >= 0) {
            if (Flagpole.toType(this.obj) == 'array') {
                obj = this.obj[i];
            }
            else if (Flagpole.toType(this.obj) == 'cheerio') {
                obj = this.obj.eq(i);
            }
        }
        return this.response.property(new Property(this.response, this.name + '[' + i + ']', obj));
    }
    first() {
        return this.nth(0);
    }
    last() {
        return this.nth((this.obj && this.obj.length) ? (this.obj.length - 1) : -1);
    }
    attribute(key) {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.attr(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return this.response.property(new Property(this.response, this.name + '[' + key + ']', text));
    }
    property(key) {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return this.response.property(new Property(this.response, this.name + '[' + key + ']', text));
    }
    data(key) {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return this.response.property(new Property(this.response, this.name + '[' + key + ']', text));
    }
    val() {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return this.response.property(new Property(this.response, 'Value of ' + this.name, text));
    }
    text() {
        let text = '';
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.text();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return this.response.property(new Property(this.response, 'Text of ' + this.name, text));
    }
    parseInt() {
        let num = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseInt(this.obj.text());
        }
        else {
            num = parseInt(this.obj);
        }
        return this.response.property(new Property(this.response, 'Text of ' + this.name, num));
    }
    parseFloat() {
        let num = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseFloat(this.obj.text());
        }
        else {
            num = parseFloat(this.obj);
        }
        return this.response.property(new Property(this.response, 'Text of ' + this.name, num));
    }
    length() {
        let count = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return this.response.property(new Property(this.response, 'Length of ' + this.name, count));
    }
    pass(message) {
        this.response.scenario.pass(this.flipAssertion ?
            'NOT: ' + message :
            message);
    }
    fail(message) {
        this.response.scenario.fail(this.flipAssertion ?
            'NOT: ' + message :
            message);
    }
    label(message) {
        this.response.label(message);
        return this;
    }
    exists() {
        let exists = false;
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
    hasClass(className) {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            this.assert(this.obj.hasClass(className)) ?
                this.pass(this.name + ' has class ' + className) :
                this.fail(this.name + ' does not have class ' + className);
        }
        return this.reset();
    }
    greaterThan(value) {
        this.assert(this.obj > value) ?
            this.pass(this.name + ' is greater than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }
    greaterThanOrEquals(value) {
        this.assert(this.obj >= value) ?
            this.pass(this.name + ' is greater than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }
    lessThan(value) {
        this.assert(this.obj < value) ?
            this.pass(this.name + ' is less than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not less than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }
    lessThanOrEquals(value) {
        this.assert(this.obj <= value) ?
            this.pass(this.name + ' is less than ' + value + ' (' + this.obj + ')') :
            this.fail(this.name + ' is not less than ' + value + ' (' + this.obj + ')');
        return this.reset();
    }
    equals(value, permissiveMatching = false) {
        let matchValue = String(this.obj);
        let positiveCase = 'equals';
        let negativeCase = 'does not equal';
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
    similarTo(value) {
        return this.equals(value, true);
    }
    contains(string) {
        let contains = false;
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
    is(type) {
        let myType = Flagpole.toType(this.obj);
        this.assert(myType == type.toLocaleLowerCase()) ?
            this.pass(this.name + ' is type ' + type) :
            this.fail(this.name + ' is not type ' + type + ' (' + myType + ')');
        return this.reset();
    }
    echo() {
        this.pass(this.name + ' = ' + this.obj);
        return this.reset();
    }
    typeof() {
        this.pass('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this.reset();
    }
}
class GenericRequest {
    constructor(scenario, url, response) {
        this.last = null;
        this.scenario = scenario;
        this.url = url;
        this.response = response;
    }
    property(property) {
        this.last = property;
        return property;
    }
    and() {
        return this.last;
    }
    headers(key) {
        if (typeof key !== 'undefined') {
            let value = typeof this.response.headers[key] !== 'undefined' ?
                this.response.headers[key] : this.response.headers[key.toLowerCase()];
            return new Property(this, 'HTTP Headers[' + key + ']', value);
        }
        else {
            return new Property(this, 'HTTP Headers', this.response.headers);
        }
    }
    status() {
        return new Property(this, 'HTTP Status', this.response.statusCode);
    }
    done() {
        this.scenario.done();
    }
    label(message) {
        this.scenario.label(message);
        return this;
    }
}
class JsonRequest extends GenericRequest {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }
    select(path, findIn) {
        let args = path.split('.');
        let obj = findIn || this.json;
        let endPoint = this;
        if (args.every(function (value) {
            obj = obj[value];
            return (typeof obj !== 'undefined');
        })) {
            this.last = new Property(endPoint, path, obj);
        }
        else {
            this.last = new Property(endPoint, path, undefined);
        }
        return this.last;
    }
}
class HtmlRequest extends GenericRequest {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.$ = cheerio.load(response.body);
    }
    select(selector, findIn) {
        let obj = null;
        if (Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(selector);
        }
        else if (typeof findIn == 'undefined') {
            obj = this.$(selector);
        }
        this.last = new Property(this, selector, obj);
        return this.last;
    }
}
class ConsoleLine {
    constructor(message, color) {
        this.color = '\x1b[0m';
        this.message = '';
        this.message = message;
        this.color = color || this.color;
    }
    write() {
        console.log(this.color, this.message, '\x1b[0m');
    }
}
exports.ConsoleLine = ConsoleLine;
class Flagpole {
    static Suite(title) {
        return new Suite(title);
    }
    static heading(message) {
        let length = Math.max(message.length + 10, 50), padding = (length - message.length) / 2;
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
        new ConsoleLine(' '.repeat(padding) + message.toLocaleUpperCase() + ' '.repeat(padding), "\x1b[33m").write();
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
    }
    static message(message, color) {
        new ConsoleLine(message, color).write();
    }
    static toSimplifiedResponse(response, body) {
        return {
            statusCode: response.statusCode,
            body: body,
            headers: response.headers,
        };
    }
    static isNullOrUndefined(obj) {
        return (typeof obj === "undefined" || obj === null);
    }
    static toType(obj) {
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
exports.Flagpole = Flagpole;
