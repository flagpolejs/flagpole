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
        this.responseType = response_1.ReponseType.html;
        this.then = null;
        this.url = null;
        this.waitToExecute = false;
        this.nextLabel = null;
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
    type(type) {
        this.responseType = type;
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
    skip(message) {
        if (!this.start) {
            message = "  »  Skipped" + (message ? ': ' + message : '');
            this.start = Date.now();
            this.log.push(new consoleline_1.ConsoleLine(message + "\n"));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }
    execute() {
        if (!this.start && this.url !== null) {
            this.start = Date.now();
            this.options.uri = this.suite.buildUrl(this.url);
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new consoleline_1.ConsoleLine('  »  Waited ' + (this.start - this.initialized) + 'ms'));
            }
            let scenario = this;
            let scenarioType = (function () {
                if (scenario.responseType == response_1.ReponseType.json) {
                    return {
                        name: 'REST End Point',
                        responseObject: jsonresponse_1.JsonResponse
                    };
                }
                else if (scenario.responseType == response_1.ReponseType.image) {
                    return {
                        name: 'Image',
                        responseObject: imageresponse_1.ImageResponse
                    };
                }
                else if (scenario.responseType == response_1.ReponseType.script) {
                    return {
                        name: 'Script',
                        responseObject: scriptresponse_1.ScriptResponse
                    };
                }
                else if (scenario.responseType == response_1.ReponseType.stylesheet) {
                    return {
                        name: 'Stylesheet',
                        responseObject: cssresponse_1.CssResponse
                    };
                }
                else if (scenario.responseType == response_1.ReponseType.resource) {
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
            })();
            this.requestStart = Date.now();
            request(this.options, function (error, response, body) {
                if (!error) {
                    scenario.requestLoaded = Date.now();
                    scenario.pass('Loaded ' + scenarioType.name + ' ' + scenario.url);
                    if (scenario.then !== null && scenario.url !== null) {
                        scenario.then(new scenarioType.responseObject(scenario, scenario.url, index_1.Flagpole.toSimplifiedResponse(response, body)));
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
    Json(title, tags) {
        return this.suite.Json(title, tags);
    }
    Image(title, tags) {
        return this.suite.Image(title, tags);
    }
    Html(title, tags) {
        return this.suite.Html(title, tags);
    }
    Stylesheet(title, tags) {
        return this.suite.Stylesheet(title, tags);
    }
    Script(title, tags) {
        return this.suite.Script(title, tags);
    }
    Resource(title, tags) {
        return this.suite.Resource(title, tags);
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
}
exports.Scenario = Scenario;
