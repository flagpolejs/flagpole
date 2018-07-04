"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const consoleline_1 = require("./consoleline");
const jsonrequest_1 = require("./jsonrequest");
const htmlrequest_1 = require("./htmlrequest");
let request = require('request');
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
        return !!(this.end && this.failures.length == 0);
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
        this.log.push(new consoleline_1.ConsoleLine(message));
        return this;
    }
    comment(message) {
        this.log.push(consoleline_1.ConsoleLine.comment('  »  ' + message));
        this.passes.push(message);
        return this;
    }
    pass(message) {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(consoleline_1.ConsoleLine.pass('  ✔  ' + message));
        this.passes.push(message);
        return this;
    }
    fail(message) {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(consoleline_1.ConsoleLine.fail('  ✕  ' + message));
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
            this.log.push(new consoleline_1.ConsoleLine("  »  Skipped\n"));
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
                this.log.push(new consoleline_1.ConsoleLine('  »  Waited ' + (this.start - this.initialized) + 'ms'));
            }
            let requestObject;
            let pageType = 'HTML Page';
            if (this.pageType == 'json') {
                pageType = 'REST End Point';
                requestObject = jsonrequest_1.JsonRequest;
            }
            else {
                requestObject = htmlrequest_1.HtmlRequest;
            }
            request(this.options, function (error, response, body) {
                if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                    scenario.pass('Loaded ' + pageType + ' ' + scenario.url);
                    if (scenario.then !== null) {
                        scenario.then(new requestObject(scenario, scenario.url, index_1.Flagpole.toSimplifiedResponse(response, body)));
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
        this.log.push(new consoleline_1.ConsoleLine("  » Took " + this.getExecutionTime() + "ms\n"));
        this.onDone(this);
        return this;
    }
}
exports.Scenario = Scenario;
