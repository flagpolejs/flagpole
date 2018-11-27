"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const consoleline_1 = require("./consoleline");
const jsonresponse_1 = require("./jsonresponse");
const htmlresponse_1 = require("./htmlresponse");
const response_1 = require("./response");
const imageresponse_1 = require("./imageresponse");
const resourceresponse_1 = require("./resourceresponse");
const scriptresponse_1 = require("./scriptresponse");
const cssresponse_1 = require("./cssresponse");
const mock_1 = require("./mock");
let request = require('request');
class Scenario {
    constructor(suite, title, onDone) {
        this.log = [];
        this.failures = [];
        this.passes = [];
        this.initialized = null;
        this.start = null;
        this.end = null;
        this.requestStart = null;
        this.requestLoaded = null;
        this.responseType = response_1.ResponseType.html;
        this.url = null;
        this.waitToExecute = false;
        this.nextLabel = null;
        this.flipAssertion = false;
        this.optionalAssertion = false;
        this.ignoreAssertion = false;
        this._then = null;
        this._isMock = false;
        this.options = {
            method: 'GET',
            headers: {}
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
    jsonBody(jsonObject) {
        this.header('Content-Type', 'application/json');
        return this.body(JSON.stringify(jsonObject));
    }
    body(str) {
        this.options.body = str;
        return this;
    }
    proxy(proxyUri) {
        this.options.proxy = proxyUri;
        return this;
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
    maxRedirects(n) {
        this.options.maxRedirects = n;
        return this;
    }
    followRedirect(onRedirect) {
        this.options.followRedirect = onRedirect;
        return this;
    }
    auth(authorization) {
        this.options.auth = authorization;
        return this;
    }
    headers(headers) {
        this.options.headers = Object.assign(this.options.headers, headers);
        return this;
    }
    header(key, value) {
        this.options.headers = this.options.headers || {};
        this.options.headers[key] = value;
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
    assert(statement, passMessage, failMessage) {
        if (!this.ignoreAssertion) {
            let passed = this.flipAssertion ? !statement : !!statement;
            if (this.flipAssertion) {
                passMessage = 'NOT: ' + passMessage;
                failMessage = 'NOT: ' + failMessage;
            }
            if (this.optionalAssertion) {
                failMessage += ' (Optional)';
            }
            if (passed) {
                this.pass(passMessage);
            }
            else {
                this.fail(failMessage, this.optionalAssertion);
            }
            return this.reset();
        }
        return this;
    }
    reset() {
        this.flipAssertion = false;
        this.optionalAssertion = false;
        return this;
    }
    not() {
        this.flipAssertion = true;
        return this;
    }
    optional() {
        this.optionalAssertion = true;
        return this;
    }
    ignore(assertions = true) {
        if (typeof assertions == 'boolean') {
            this.ignoreAssertion = assertions;
        }
        else if (typeof assertions == 'function') {
            this.ignore(true);
            assertions();
            this.ignore(false);
        }
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
    fail(message, isOptional = false) {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(consoleline_1.ConsoleLine.fail('  ✕  ' + message, isOptional));
        if (!isOptional) {
            this.failures.push(message);
        }
        return this;
    }
    executeWhenReady() {
        if (!this.waitToExecute && this.canExecute()) {
            this.execute();
        }
    }
    open(url) {
        if (!this.hasExecuted()) {
            this.url = url;
            this._isMock = false;
            this.executeWhenReady();
        }
        return this;
    }
    then(callback) {
        if (!this.hasExecuted()) {
            this._then = callback;
            this.executeWhenReady();
        }
        return this;
    }
    assertions(callback) {
        return this.then(callback);
    }
    skip(message) {
        if (!this.hasExecuted()) {
            message = "  »  Skipped" + (message ? ': ' + message : '');
            this.start = Date.now();
            this.log.push(new consoleline_1.ConsoleLine(message + "\n"));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }
    getScenarioType() {
        if (this.responseType == response_1.ResponseType.json) {
            return {
                name: 'REST End Point',
                responseObject: jsonresponse_1.JsonResponse
            };
        }
        else if (this.responseType == response_1.ResponseType.image) {
            return {
                name: 'Image',
                responseObject: imageresponse_1.ImageResponse
            };
        }
        else if (this.responseType == response_1.ResponseType.script) {
            return {
                name: 'Script',
                responseObject: scriptresponse_1.ScriptResponse
            };
        }
        else if (this.responseType == response_1.ResponseType.stylesheet) {
            return {
                name: 'Stylesheet',
                responseObject: cssresponse_1.CssResponse
            };
        }
        else if (this.responseType == response_1.ResponseType.resource) {
            return {
                name: 'Resource',
                responseObject: resourceresponse_1.ResourceResponse
            };
        }
        else {
            return {
                name: 'HTML Page',
                responseObject: htmlresponse_1.HtmlResponse
            };
        }
    }
    processResponse(simplifiedResponse) {
        let scenarioType = this.getScenarioType();
        this.requestLoaded = Date.now();
        this.pass('Loaded ' + scenarioType.name + ' ' + this.url);
        if (this._then !== null && this.url !== null) {
            this._then(new scenarioType.responseObject(this, this.url, simplifiedResponse));
        }
        this.done();
    }
    executeRequest() {
        if (!this.requestStart && this.url !== null) {
            let scenario = this;
            this.requestStart = Date.now();
            this.options.uri = this.suite.buildUrl(this.url);
            if (this.responseType == response_1.ResponseType.image) {
                require('probe-image-size')(this.options.uri, this.options, function (error, result) {
                    if (!error) {
                        scenario.processResponse({
                            statusCode: 200,
                            body: JSON.stringify(result),
                            headers: {
                                'content-type': result.mime
                            }
                        });
                    }
                    else {
                        scenario.fail('Failed to load image ' + scenario.url);
                        scenario.done();
                    }
                });
            }
            else {
                request(this.options, function (error, response, body) {
                    if (!error) {
                        scenario.processResponse(index_1.Flagpole.toSimplifiedResponse(response, body));
                    }
                    else {
                        scenario.fail('Failed to load ' + scenario.url);
                        scenario.done();
                    }
                });
            }
        }
    }
    executeMock() {
        if (!this.requestStart && this.url !== null) {
            let scenario = this;
            this.requestStart = Date.now();
            mock_1.Mock.loadLocalFile(this.url).then(function (mock) {
                scenario.processResponse(mock);
            }).catch(function () {
                scenario.fail('Failed to load page ' + scenario.url);
                scenario.done();
            });
        }
    }
    execute() {
        if (!this.hasExecuted() && this.url !== null) {
            this.start = Date.now();
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new consoleline_1.ConsoleLine('  »  Waited ' + (this.start - this.initialized) + 'ms'));
            }
            this._isMock ?
                this.executeMock() :
                this.executeRequest();
        }
        return this;
    }
    mock(localPath) {
        this.url = localPath;
        this._isMock = true;
        this.executeWhenReady();
        return this;
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
    getUrl() {
        return this.url;
    }
    getRequestLoadTime() {
        return (this.requestLoaded && this.requestStart) ?
            (this.requestLoaded - this.requestStart) : null;
    }
    canExecute() {
        return (!this.hasExecuted() && this.url !== null && this._then !== null);
    }
    hasExecuted() {
        return this.start !== null;
    }
    hasFinished() {
        return this.hasExecuted() && this.end !== null;
    }
    setResponseType(type) {
        if (this.hasExecuted()) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        this.responseType = type;
        return this;
    }
    image() {
        return this.setResponseType(response_1.ResponseType.image);
    }
    html() {
        return this.setResponseType(response_1.ResponseType.html);
    }
    json() {
        return this.setResponseType(response_1.ResponseType.json);
    }
    script() {
        return this.setResponseType(response_1.ResponseType.script);
    }
    stylesheet() {
        return this.setResponseType(response_1.ResponseType.stylesheet);
    }
    resource() {
        return this.setResponseType(response_1.ResponseType.resource);
    }
}
exports.Scenario = Scenario;
