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
    assert(statement, passMessage, failMessage) {
        return this.response.assert(statement, passMessage, failMessage);
    }
    and() {
        return this.response.and();
    }
    not() {
        return this.response.not();
    }
    toString() {
        if ((index_1.Flagpole.toType(this.obj) == 'cheerio')) {
            return this.obj.text().toString();
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
        return this.response;
    }
    label(message) {
        this.response.label(message);
        return this.response;
    }
    length() {
        let count = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Value(this.response, 'Length of ' + this.name, count);
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
        let myType = index_1.Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()), this.name + ' is type ' + type, this.name + ' is not type ' + type + ' (' + myType + ')');
    }
    echo() {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }
    typeof() {
        this.comment('typeof ' + this.name + ' = ' + index_1.Flagpole.toType(this.obj));
        return this;
    }
    each(callback) {
        let name = this.name;
        let response = this.response;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'array') {
            this.obj.forEach(function (el, index) {
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'object') {
            let obj = this.obj;
            this.obj.keys().forEach(function (key) {
                let element = new Element(response, name + '[' + key + ']', obj[key]);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function (word, index) {
                let value = new Value(response, name + '[' + index + ']', word);
                callback(value);
            });
        }
        return this.response;
    }
    every(callback) {
        let name = this.name;
        let response = this.response;
        let every = true;
        this.response.startIgnoringAssertions();
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                if (!callback(element)) {
                    every = false;
                }
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'array') {
            every = this.obj.every(function (el, index) {
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                return callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'object') {
            let obj = this.obj;
            every = this.obj.keys().every(function (key) {
                let element = new Element(response, name + '[' + key + ']', obj[key]);
                response.lastElement(element);
                return callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'string') {
            every = this.obj.toString().trim().split(' ').every(function (word, index) {
                let value = new Value(response, name + '[' + index + ']', word);
                return callback(value);
            });
        }
        this.response.stopIgnoringAssertions();
        return this.assert(every, 'Every ' + this.name + ' passed', 'Every ' + this.name + ' did not pass');
    }
    some(callback) {
        let name = this.name;
        let response = this.response;
        let some = false;
        this.response.startIgnoringAssertions();
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                if (callback(element)) {
                    some = true;
                }
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'array') {
            some = this.obj.some(function (el, index) {
                let element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                return callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'object') {
            let obj = this.obj;
            some = this.obj.keys().some(function (key) {
                let element = new Element(response, name + '[' + key + ']', obj[key]);
                response.lastElement(element);
                return callback(element);
            });
        }
        else if (index_1.Flagpole.toType(this.obj) == 'string') {
            some = this.obj.toString().trim().split(' ').some(function (word, index) {
                let value = new Value(response, name + '[' + index + ']', word);
                return callback(value);
            });
        }
        this.response.stopIgnoringAssertions();
        return this.assert(some, 'Some ' + this.name + ' passed', 'No ' + this.name + ' passed');
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
    parseInt() {
        let num = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            num = parseInt(this.obj.text());
        }
        else {
            num = parseInt(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }
    parseFloat() {
        let num = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
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
class Value extends Property {
}
exports.Value = Value;
class Element extends Property {
    constructor(response, name, obj) {
        super(response, name, obj);
    }
    click(nextScenario) {
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
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
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.next(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    prev(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.prev(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    closest(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.closest(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    parents(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.parents(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    siblings(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.siblings(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }
    children(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
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
            if (index_1.Flagpole.toType(this.obj) == 'array') {
                obj = this.obj[i];
            }
            else if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
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
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.attr(key);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    property(key) {
        let text;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    data(key) {
        let text = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response, this.name + '[' + key + ']', text);
    }
    val() {
        let text = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            text = this.obj;
        }
        return new Value(this.response, 'Value of ' + this.name, text);
    }
    hasClass(className) {
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
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
exports.Element = Element;
