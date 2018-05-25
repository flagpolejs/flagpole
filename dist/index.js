"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let request = require('request');
let cheerio = require('cheerio');
let $ = cheerio;
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
                process.exit(suite.passed() ? 0 : 1);
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
    comment(message) {
        this.log.push(new ConsoleLine('  »  ' + message, "\x1b[34m"));
        this.passes.push(message);
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
                    if (scenario.then !== null) {
                        scenario.then(new requestObject(scenario, scenario.url, Flagpole.toSimplifiedResponse(response, body)));
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
        this.response = response;
        this.name = name;
        this.obj = obj;
    }
    assert(statement, passMessage, failMessage) {
        return this.response.assert(statement, passMessage, failMessage);
    }
    not() {
        return this.response.not();
    }
    toString() {
        if ((Flagpole.toType(this.obj) == 'cheerio')) {
            return this.obj.text();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.toString) {
            return this.obj.toString();
        }
        else {
            return String(this.obj);
        }
    }
    get() {
        return this.obj;
    }
    text() {
        let text = this.toString();
        let name = 'Text of ' + this.name;
        let value = new Value(this.response, name, text);
        value.length().greaterThan(0);
        return value;
    }
    pass(message) {
        return this.response.scenario.pass(message);
    }
    fail(message) {
        return this.response.scenario.fail(message);
    }
    comment(message) {
        this.response.scenario.comment(message);
        return this;
    }
    label(message) {
        this.response.label(message);
        return this;
    }
    length() {
        let count = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Value(this.response, 'Length of ' + this.name, count);
    }
    contains(string) {
        let contains = false;
        if (Flagpole.toType(this.obj) == 'array') {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            contains = (this.obj.hasOwnProperty(string));
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            contains = (this.toString().indexOf(string) >= 0);
        }
        return this.assert(contains, this.name + ' contains ' + string, this.name + ' does not contain ' + string);
    }
    startsWith(matchText) {
        let assert = false;
        let value = '';
        if (!Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert, this.name + ' starts with ' + matchText, this.name + ' does not start with ' + matchText + ' (' + value + ')');
    }
    endsWith(matchText) {
        let assert = false;
        let value = '';
        if (!Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert, this.name + ' ends with ' + matchText, this.name + ' does not end with ' + matchText + ' (' + value + ')');
    }
    trim() {
        let text = this.toString().trim();
        return new Value(this.response, 'Trimmed text of ' + this.name, text);
    }
    toLowerCase() {
        let text = this.toString().toLowerCase();
        return new Value(this.response, 'Lowercased text of ' + this.name, text);
    }
    toUpperCase() {
        let text = this.toString().toUpperCase();
        return new Value(this.response, 'Uppercased text of ' + this.name, text);
    }
    replace(search, replace) {
        let text = this.toString().replace(search, replace);
        return new Value(this.response, 'Replaced text of ' + this.name, text);
    }
    is(type) {
        let myType = Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()), this.name + ' is type ' + type, this.name + ' is not type ' + type + ' (' + myType + ')');
    }
    echo() {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }
    typeof() {
        this.comment('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this;
    }
    each(callback) {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            let name = this.name;
            let response = this.response;
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                callback(element);
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
    exists() {
        let exists = false;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            exists = (this.obj.length > 0);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            exists = true;
        }
        return this.assert(exists, this.name + ' exists', this.name + ' does not exist');
    }
    parseInt() {
        let num = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseInt(this.obj.text());
        }
        else {
            num = parseInt(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }
    parseFloat() {
        let num = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseFloat(this.obj.text());
        }
        else {
            num = parseFloat(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }
    headers(key) {
        return this.response.headers(key);
    }
    select(path, findIn) {
        return this.response.select(path, findIn);
    }
}
class Value extends Property {
    greaterThan(value) {
        return this.assert(this.obj > value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    greaterThanOrEquals(value) {
        return this.assert(this.obj >= value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    lessThan(value) {
        return this.assert(this.obj < value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
    }
    lessThanOrEquals(value) {
        return this.assert(this.obj <= value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
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
        return this.assert(matchValue == value, this.name + ' ' + positiveCase + ' ' + value, this.name + ' ' + negativeCase + ' ' + value + ' (' + matchValue + ')');
    }
    similarTo(value) {
        return this.equals(value, true);
    }
}
class Element extends Property {
    and() {
        return this.response.and();
    }
    click(nextScenario) {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            let href = this.attribute('href').toString();
            if (!nextScenario.isDone()) {
                nextScenario.open(href).execute();
            }
        }
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
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    prev(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.prev(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    closest(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.closest(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    parents(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.parents(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    siblings(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.siblings(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    children(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.children(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
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
        return this.response.lastElement(new Element(this.response, this.name + '[' + i + ']', obj));
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
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    property(key) {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    data(key) {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    val() {
        let text = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return new Value(this.response, 'Value of ' + this.name, text);
    }
    hasClass(className) {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            return this.assert(this.obj.hasClass(className), this.name + ' has class ' + className, this.name + ' does not have class ' + className);
        }
        return this.response;
    }
    greaterThan(value) {
        return this.parseFloat().greaterThan(value);
    }
    greaterThanOrEquals(value) {
        return this.parseFloat().greaterThanOrEquals(value);
    }
    lessThan(value) {
        return this.parseFloat().lessThan(value);
    }
    lessThanOrEquals(value) {
        return this.parseFloat().lessThanOrEquals(value);
    }
    equals(value, permissiveMatching = false) {
        return this.text().equals(value, permissiveMatching);
    }
    similarTo(value) {
        return this.text().similarTo(value);
    }
}
class GenericRequest {
    constructor(scenario, url, response) {
        this.flipAssertion = false;
        this.scenario = scenario;
        this.url = url;
        this.response = response;
        this.last = new Element(this, 'Empty Element', []);
    }
    assert(statement, passMessage, failMessage) {
        (this.flipAssertion ? !statement : !!statement) ?
            this.scenario.pass(this.flipAssertion ? 'NOT: ' + passMessage : passMessage) :
            this.scenario.fail(this.flipAssertion ? 'NOT: ' + failMessage : failMessage);
        return this.reset();
    }
    reset() {
        this.flipAssertion = false;
        return this;
    }
    not() {
        this.flipAssertion = true;
        return this;
    }
    lastElement(property) {
        if (typeof property == 'undefined') {
            return this.last || new Element(this, 'Empty Element', []);
        }
        else {
            this.last = property;
            return property;
        }
    }
    echo() {
        return this.lastElement().echo();
    }
    typeof() {
        return this.lastElement().typeof();
    }
    and() {
        return this.last || new Element(this, 'Empty Element', []);
    }
    comment(message) {
        this.scenario.comment(message);
        return this;
    }
    headers(key) {
        if (typeof key !== 'undefined') {
            key = typeof this.response.headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name = 'HTTP Headers[' + key + ']';
            let value = new Value(this, name, this.response.headers[key]);
            value.exists();
            return value;
        }
        else {
            return new Value(this, 'HTTP Headers', this.response.headers);
        }
    }
    status() {
        return new Value(this, 'HTTP Status', this.response.statusCode);
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
        let response = this;
        let element;
        if (args.every(function (value) {
            obj = obj[value];
            return (typeof obj !== 'undefined');
        })) {
            element = new Element(response, path, obj);
        }
        else {
            element = new Element(response, path, undefined);
        }
        this.lastElement(element);
        element.exists();
        return element;
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
        else {
            obj = this.$(selector);
        }
        let element = new Element(this, selector, obj);
        this.lastElement(element);
        element.exists();
        return element;
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
