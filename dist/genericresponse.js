"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("./node");
class GenericResponse {
    constructor(scenario, url, response) {
        this.flipAssertion = false;
        this.ignoreAssertion = false;
        this.scenario = scenario;
        this.url = url;
        this.response = response;
        this._lastElement = new node_1.Node(this, 'Empty Element', []);
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
    lastElement(property) {
        if (typeof property == 'undefined') {
            return this._lastElement || new node_1.Node(this, 'Empty Element', []);
        }
        else {
            this._lastElement = property;
            return property;
        }
    }
    get() {
        return this.lastElement().get();
    }
    echo() {
        return this.lastElement().echo();
    }
    typeof() {
        return this.lastElement().typeof();
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
    label(message) {
        this.scenario.label(message);
        return this;
    }
    text() {
        return this.lastElement().text();
    }
    length() {
        return this.lastElement().length();
    }
    contains(string) {
        return this.lastElement().contains(string);
    }
    matches(pattern) {
        return this.lastElement().matches(pattern);
    }
    startsWith(matchText) {
        return this.lastElement().startsWith(matchText);
    }
    endsWith(matchText) {
        return this.lastElement().endsWith(matchText);
    }
    trim() {
        return this.lastElement().text().trim();
    }
    toLowerCase() {
        return this.lastElement().text().toLowerCase();
    }
    toUpperCase() {
        return this.lastElement().text().toUpperCase();
    }
    replace(search, replace) {
        return this.lastElement().text().replace(search, replace);
    }
    is(type) {
        return this.lastElement().is(type);
    }
    each(callback) {
        return this.lastElement().each(callback);
    }
    some(callback) {
        return this.lastElement().some(callback);
    }
    every(callback) {
        return this.lastElement().every(callback);
    }
    exists() {
        return this.lastElement().exists();
    }
    parseInt() {
        return this.lastElement().text().parseInt();
    }
    parseFloat() {
        return this.lastElement().text().parseFloat();
    }
    greaterThan(value) {
        return this.lastElement().greaterThan(value);
    }
    greaterThanOrEquals(value) {
        return this.lastElement().greaterThanOrEquals(value);
    }
    lessThan(value) {
        return this.lastElement().lessThan(value);
    }
    lessThanOrEquals(value) {
        return this.lastElement().lessThanOrEquals(value);
    }
    equals(value, permissiveMatching) {
        return this.lastElement().equals(value, permissiveMatching);
    }
    similarTo(value) {
        return this.lastElement().similarTo(value);
    }
}
exports.GenericResponse = GenericResponse;
