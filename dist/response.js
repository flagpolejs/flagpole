"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
var ResponseType;
(function (ResponseType) {
    ResponseType[ResponseType["html"] = 0] = "html";
    ResponseType[ResponseType["json"] = 1] = "json";
    ResponseType[ResponseType["image"] = 2] = "image";
    ResponseType[ResponseType["stylesheet"] = 3] = "stylesheet";
    ResponseType[ResponseType["script"] = 4] = "script";
    ResponseType[ResponseType["resource"] = 5] = "resource";
})(ResponseType = exports.ResponseType || (exports.ResponseType = {}));
class GenericResponse {
    constructor(scenario, url, simplifiedResponse) {
        this._lastElementPath = null;
        this.scenario = scenario;
        this._url = url;
        this._statusCode = simplifiedResponse.statusCode;
        this._body = simplifiedResponse.body;
        this._headers = simplifiedResponse.headers;
        this._lastElement = new node_1.Node(this, 'Empty Element', null);
    }
    absolutizeUri(uri) {
        let baseUrl = new URL(this.scenario.suite.buildUrl(this.scenario.getUrl() || ''));
        return (new URL(uri, baseUrl.href)).href;
    }
    getUrl() {
        return this._url;
    }
    getBody() {
        return this._body;
    }
    getRoot() {
        return this._body;
    }
    select(path, findIn) {
        return new node_1.Node(this, 'Body', this._body);
    }
    assert(statement, passMessage, failMessage) {
        this.scenario.assert(statement, passMessage, failMessage);
        return this;
    }
    not() {
        this.scenario.not();
        return this;
    }
    optional() {
        this.scenario.optional();
        return this;
    }
    ignore(assertions = true) {
        this.scenario.ignore(assertions);
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
            key = typeof this._headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name = 'HTTP Headers[' + key + ']';
            let value = new node_1.Node(this, name, this._headers[key]);
            value.exists();
            return value;
        }
        else {
            return new node_1.Node(this, 'HTTP Headers', this._headers);
        }
    }
    status() {
        return new node_1.Node(this, 'HTTP Status', this._statusCode);
    }
    length() {
        return new node_1.Node(this, 'Length of Response Body', this._body.length);
    }
    loadTime() {
        return new node_1.Node(this, 'Load Time', this.scenario.getRequestLoadTime());
    }
}
exports.GenericResponse = GenericResponse;
