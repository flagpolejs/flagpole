"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
let cheerio = require('cheerio');
let $ = cheerio;
class Property {
    constructor(response, name, obj) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }
    not() {
        return this.response.not();
    }
    toString() {
        if ((index_1.Flagpole.toType(this.obj) == 'cheerio')) {
            return (this.obj.text() || this.obj.val()).toString();
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.toString) {
            return this.obj.toString();
        }
        else {
            return String(this.obj);
        }
    }
    get() {
        return this.obj;
    }
    pass(message) {
        return this.response.scenario.pass(message);
    }
    fail(message) {
        return this.response.scenario.fail(message);
    }
    comment(message) {
        this.response.scenario.comment(message);
        return this.response;
    }
    label(message) {
        this.response.label(message);
        return this.response;
    }
    echo() {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }
    typeof() {
        this.comment('typeof ' + this.name + ' = ' + index_1.Flagpole.toType(this.obj));
        return this;
    }
    assert(statement, passMessage, failMessage) {
        return this.response.assert(statement, passMessage, failMessage);
    }
    contains(string) {
        let contains = false;
        if (index_1.Flagpole.toType(this.obj) == 'array') {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (index_1.Flagpole.toType(this.obj) == 'object') {
            contains = (this.obj.hasOwnProperty(string));
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            contains = (this.toString().indexOf(string) >= 0);
        }
        return this.assert(contains, this.name + ' contains ' + string, this.name + ' does not contain ' + string);
    }
    matches(pattern) {
        let value = this.toString();
        return this.assert(pattern.test(value), this.name + ' matches ' + String(pattern), this.name + ' does not match ' + String(pattern) + ' (' + value + ')');
    }
    startsWith(matchText) {
        let assert = false;
        let value = '';
        if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert, this.name + ' starts with ' + matchText, this.name + ' does not start with ' + matchText + ' (' + value + ')');
    }
    endsWith(matchText) {
        let assert = false;
        let value = '';
        if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert, this.name + ' ends with ' + matchText, this.name + ' does not end with ' + matchText + ' (' + value + ')');
    }
    is(type) {
        let myType = index_1.Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()), this.name + ' is type ' + type, this.name + ' is not type ' + type + ' (' + myType + ')');
    }
    exists() {
        let exists = false;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            exists = (this.obj.length > 0);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            exists = true;
        }
        return this.assert(exists, this.name + ' exists', this.name + ' does not exist');
    }
    headers(key) {
        return this.response.headers(key);
    }
    equals(value, permissiveMatching = false) {
        let matchValue = this.toString();
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
exports.Property = Property;
