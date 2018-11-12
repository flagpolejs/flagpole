"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
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
    setLastElement(path, element) {
        this._lastElement = element;
        this._lastElementPath = path;
        return element;
    }
    getLastElement() {
        return this._lastElement || new node_1.Node(this, 'Empty Element', []);
    }
    get() {
        return this.getLastElement().get();
    }
    echo() {
        return this.getLastElement().echo();
    }
    typeof() {
        return this.getLastElement().typeof();
    }
    and() {
        return this._lastElement || new node_1.Node(this, 'Empty Element', []);
    }
    comment(message) {
        this.scenario.comment(message);
        return this;
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
    label(message) {
        this.scenario.label(message);
        return this;
    }
    text() {
        return this.getLastElement().text();
    }
    length() {
        return this.getLastElement().length();
    }
    contains(string) {
        return this.getLastElement().contains(string);
    }
    matches(pattern) {
        return this.getLastElement().matches(pattern);
    }
    startsWith(matchText) {
        return this.getLastElement().startsWith(matchText);
    }
    endsWith(matchText) {
        return this.getLastElement().endsWith(matchText);
    }
    trim() {
        return this.getLastElement().text().trim();
    }
    toLowerCase() {
        return this.getLastElement().text().toLowerCase();
    }
    toUpperCase() {
        return this.getLastElement().text().toUpperCase();
    }
    replace(search, replace) {
        return this.getLastElement().text().replace(search, replace);
    }
    is(type) {
        return this.getLastElement().is(type);
    }
    each(callback) {
        return this.getLastElement().each(callback);
    }
    some(callback) {
        return this.getLastElement().some(callback);
    }
    every(callback) {
        return this.getLastElement().every(callback);
    }
    exists() {
        return this.getLastElement().exists();
    }
    parseInt() {
        return this.getLastElement().text().parseInt();
    }
    parseFloat() {
        return this.getLastElement().text().parseFloat();
    }
    greaterThan(value) {
        return this.getLastElement().greaterThan(value);
    }
    greaterThanOrEquals(value) {
        return this.getLastElement().greaterThanOrEquals(value);
    }
    lessThan(value) {
        return this.getLastElement().lessThan(value);
    }
    lessThanOrEquals(value) {
        return this.getLastElement().lessThanOrEquals(value);
    }
    equals(value, permissiveMatching) {
        return this.getLastElement().equals(value, permissiveMatching);
    }
    similarTo(value) {
        return this.getLastElement().similarTo(value);
    }
}
exports.GenericResponse = GenericResponse;
