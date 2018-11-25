"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
var ReponseType;
(function (ReponseType) {
    ReponseType[ReponseType["html"] = 0] = "html";
    ReponseType[ReponseType["json"] = 1] = "json";
    ReponseType[ReponseType["image"] = 2] = "image";
    ReponseType[ReponseType["stylesheet"] = 3] = "stylesheet";
    ReponseType[ReponseType["script"] = 4] = "script";
    ReponseType[ReponseType["resource"] = 5] = "resource";
})(ReponseType = exports.ReponseType || (exports.ReponseType = {}));
class GenericResponse {
    constructor(scenario, url, response) {
        this.flipAssertion = false;
        this.ignoreAssertion = false;
        this._lastElementPath = null;
        this.scenario = scenario;
        this.url = url;
        this.response = response;
        this._lastElement = new node_1.Node(this, 'Empty Element', null);
    }
    absolutizeUri(uri) {
        let baseUrl = new URL(this.scenario.suite.buildUrl(this.scenario.getUrl() || ''));
        return (new URL(uri, baseUrl.href)).href;
    }
    getBody() {
        return this.response.body;
    }
    getRoot() {
        return this.response.body;
    }
    select(path, findIn) {
        return new node_1.Node(this, 'Body', this.response.body);
    }
    assert(statement, passMessage, failMessage) {
        if (!this.ignoreAssertion) {
            (this.flipAssertion ? !statement : !!statement) ?
                this.scenario.pass(this.flipAssertion ? 'NOT: ' + passMessage : passMessage) :
                this.scenario.fail(this.flipAssertion ? 'NOT: ' + failMessage : failMessage);
            return this.reset();
        }
        return this;
    }
    reset() {
        this.flipAssertion = false;
        return this;
    }
    startIgnoringAssertions() {
        this.ignoreAssertion = true;
        return this;
    }
    stopIgnoringAssertions() {
        this.ignoreAssertion = false;
        return this;
    }
    not() {
        this.flipAssertion = true;
        return this;
    }
    label(message) {
        this.scenario.label(message);
        return this;
    }
    comment(message) {
        this.scenario.comment(message);
        return this;
    }
    setLastElement(path, element) {
        this._lastElement = element;
        this._lastElementPath = path;
        return element;
    }
    getLastElement() {
        return this._lastElement || new node_1.Node(this, 'Empty Element', []);
    }
    getLastElementPath() {
        return this._lastElementPath;
    }
    and() {
        return this.getLastElement();
    }
    headers(key) {
        if (typeof key !== 'undefined') {
            key = typeof this.response.headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name = 'HTTP Headers[' + key + ']';
            let value = new node_1.Node(this, name, this.response.headers[key]);
            value.exists();
            return value;
        }
        else {
            return new node_1.Node(this, 'HTTP Headers', this.response.headers);
        }
    }
    status() {
        return new node_1.Node(this, 'HTTP Status', this.response.statusCode);
    }
    loadTime() {
        return new node_1.Node(this, 'Load Time', this.scenario.getRequestLoadTime());
    }
}
exports.GenericResponse = GenericResponse;
