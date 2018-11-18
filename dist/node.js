"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
let $ = require('cheerio');
class Node {
    constructor(response, name, obj) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }
    isNullOrUndefined() {
        return _1.Flagpole.isNullOrUndefined(this.obj);
    }
    isDomElement() {
        return (_1.Flagpole.toType(this.obj) == 'cheerio');
    }
    getTagName() {
        if (this.isDomElement()) {
            return this.obj.get(0).tagName;
        }
        return null;
    }
    isFormElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'form';
        }
        return false;
    }
    isButtonElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'button';
        }
        return false;
    }
    isLinkElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'a';
        }
        return false;
    }
    isClickable() {
        return (this.isLinkElement() || this.isButtonElement());
    }
    isArray() {
        return _1.Flagpole.toType(this.obj) == 'array';
    }
    isString() {
        return _1.Flagpole.toType(this.obj) == 'string';
    }
    isObject() {
        return _1.Flagpole.toType(this.obj) == 'object';
    }
    hasProperty(key) {
        return this.obj.hasOwnProperty && this.obj.hasOwnProperty(key);
    }
    pass(message) {
        return this.response.scenario.pass(message);
    }
    fail(message) {
        return this.response.scenario.fail(message);
    }
    get(index) {
        if (typeof index !== 'undefined') {
            if (this.isArray()) {
                return this.obj[index];
            }
            else if (this.isDomElement()) {
                return this.obj.eq(index);
            }
        }
        return this.obj;
    }
    toString() {
        if (this.isDomElement()) {
            return (this.obj.text() || this.obj.val()).toString();
        }
        else if (!this.isNullOrUndefined() && this.obj.toString) {
            return this.obj.toString();
        }
        else {
            return String(this.obj);
        }
    }
    select(path, findIn) {
        return this.response.select(path, findIn);
    }
    headers(key) {
        return this.response.headers(key);
    }
    status() {
        return this.response.status();
    }
    loadTime() {
        return this.response.loadTime();
    }
    and() {
        return this.response.and();
    }
    not() {
        this.response.not();
        return this;
    }
    comment(message) {
        this.response.scenario.comment(message);
        return this;
    }
    label(message) {
        this.response.label(message);
        return this;
    }
    echo() {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }
    typeof() {
        this.comment('typeof ' + this.name + ' = ' + _1.Flagpole.toType(this.obj));
        return this;
    }
    click(nextScenario) {
        if (this.isLinkElement()) {
            let href = this.attribute('href').toString();
            if (href && !nextScenario.isDone()) {
                nextScenario.open(href).execute();
            }
        }
        else if (this.isButtonElement()) {
            if (this.attribute('type').toString().toLowerCase() === 'submit') {
                let formNode = new Node(this.response, 'form', this.obj.parents('form'));
                formNode.submit(nextScenario);
            }
        }
        else {
            this.fail('Not a clickable element');
        }
        return this;
    }
    submit(nextScenario) {
        if (this.isFormElement()) {
            let action = this.obj.attr('action') || this.response.scenario.getUrl() || '';
            if (action.length > 0) {
                let method = this.obj.attr('method') || 'get';
                nextScenario.method(method);
                if (method == 'get') {
                    action = action.split('?')[0] + '?' + this.obj.serialize();
                }
                else {
                    let formDataArray = this.obj.serializeArray();
                    let formData = {};
                    formDataArray.forEach(function (input) {
                        formData[input.name] = input.value;
                    });
                    nextScenario.form(formData);
                }
                if (!nextScenario.isDone()) {
                    this.comment('Submitting form');
                    nextScenario.open(action).execute();
                }
            }
        }
        return this;
    }
    fillForm(formData) {
        if (this.isFormElement()) {
            this.comment('Filling out form');
            if (_1.Flagpole.toType(formData) === 'object') {
                let form = this.obj;
                for (let name in formData) {
                    this.assert(form.find('[name="' + name + '"]').val(formData[name]).val() == formData[name], 'Form field ' + name + ' equals ' + formData[name], 'Form field ' + name + ' does not equal ' + formData[name]);
                }
            }
        }
        else {
            this.fail('Not a form');
        }
        return this;
    }
    find(selector) {
        return this.response.select(selector, this.obj);
    }
    closest(selector) {
        let name = 'closest ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().closest(selector)));
        }
        else if (this.isObject()) {
            let arrPath = (this.response.getLastElementPath() || '').split('.');
            let found = false;
            let i = arrPath.length - 1;
            for (; i >= 0; i--) {
                if (arrPath[i] == selector) {
                    found = true;
                    break;
                }
            }
            if (found) {
                return this.select(arrPath.slice(0, i + 1).join('.'));
            }
        }
        return this.response.setLastElement('', new Node(this.response, name, null));
    }
    parents(selector) {
        let name = 'parent ' + selector;
        if (typeof selector == 'undefined') {
            return this.parent();
        }
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().parents(selector)));
        }
        else if (this.isObject()) {
            let arrPath = (this.response.getLastElementPath() || '').split('.');
            if (arrPath.length > 1) {
                let found = false;
                let i = arrPath.length - 2;
                for (; i >= 0; i--) {
                    if (arrPath[i] == selector) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    return this.select(arrPath.slice(0, i + 1).join('.'));
                }
            }
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    parent() {
        let name = 'parent';
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().parent()));
        }
        else if (this.isObject()) {
            let arrPath = (this.response.getLastElementPath() || '').split('.');
            if (arrPath.length > 1) {
                return this.select(arrPath.slice(0, arrPath.length - 1).join('.'));
            }
            else {
                return this.response.setLastElement('', new Node(this.response, name, this.response.getRoot()));
            }
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    siblings(selector) {
        let name = 'siblings ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().siblings(selector)));
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    children(selector) {
        let name = 'children ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().children(selector)));
        }
        else if (this.isObject() || this.isArray()) {
            let obj = this.get();
            if (typeof selector !== 'undefined') {
                return this.select(selector, obj);
            }
            return this.response.setLastElement(null, new Node(this.response, name, obj));
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    next(selector) {
        let name = 'next ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().next(selector)));
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    prev(selector) {
        let name = 'next ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().prev(selector)));
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }
    eq(i) {
        return this.nth(i);
    }
    nth(i) {
        let obj = null;
        if (i >= 0) {
            if (this.isArray()) {
                obj = this.obj[i];
            }
            else if (this.isDomElement()) {
                obj = this.obj.eq(i);
            }
        }
        return this.response.setLastElement(null, new Node(this.response, this.name + '[' + i + ']', obj));
    }
    first() {
        return this.nth(0);
    }
    last() {
        return this.nth((this.obj && this.obj.length) ? (this.obj.length - 1) : -1);
    }
    attribute(key) {
        let text = null;
        if (this.isDomElement()) {
            text = this.obj.attr(key);
        }
        else if (!_1.Flagpole.isNullOrUndefined(this.obj) && this.hasProperty(key)) {
            text = this.obj[key];
        }
        else if (this.response.getLastElement().isDomElement()) {
            text = this.response.getLastElement().get().attr(key);
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }
    property(key) {
        let text;
        if (this.isDomElement()) {
            text = this.obj.prop(key);
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            text = this.obj[key];
        }
        else if (this.response.getLastElement().isDomElement()) {
            text = this.response.getLastElement().get().prop(key);
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }
    data(key) {
        let text = null;
        if (this.isDomElement()) {
            text = this.obj.data(key);
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            text = this.obj[key];
        }
        else if (this.response.getLastElement().isDomElement()) {
            text = this.response.getLastElement().get().data(key);
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }
    val() {
        let text = null;
        if (this.isDomElement()) {
            text = this.obj.val();
        }
        else if (!this.isNullOrUndefined()) {
            text = this.obj;
        }
        return new Node(this.response, 'Value of ' + this.name, text);
    }
    text() {
        let text = null;
        if (this.isDomElement()) {
            text = this.obj.text();
        }
        else if (!this.isNullOrUndefined()) {
            text = this.obj.toString();
        }
        return new Node(this.response, 'Text of ' + this.name, text);
    }
    length() {
        let count = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Node(this.response, 'Length of ' + this.name, count);
    }
    parseFloat() {
        return new Node(this.response, 'Float of ' + this.name, parseFloat(this.toString()));
    }
    parseInt() {
        return new Node(this.response, 'Integer of ' + this.name, parseInt(this.toString()));
    }
    trim() {
        let text = this.toString().trim();
        return new Node(this.response, 'Trimmed text of ' + this.name, text);
    }
    toLowerCase() {
        let text = this.toString().toLowerCase();
        return new Node(this.response, 'Lowercased text of ' + this.name, text);
    }
    toUpperCase() {
        let text = this.toString().toUpperCase();
        return new Node(this.response, 'Uppercased text of ' + this.name, text);
    }
    replace(search, replace) {
        let text = this.toString().replace(search, replace);
        return new Node(this.response, 'Replaced text of ' + this.name, text);
    }
    each(callback) {
        let name = this.name;
        let response = this.response;
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                callback(new Node(response, name + '[' + index + ']', el));
            });
        }
        else if (this.isArray()) {
            this.obj.forEach(function (el, index) {
                callback(new Node(response, name + '[' + index + ']', el));
            });
        }
        else if (_1.Flagpole.toType(this.obj) == 'object') {
            let obj = this.obj;
            this.obj.keys().forEach(function (key) {
                callback(new Node(response, name + '[' + key + ']', obj[key]));
            });
        }
        else if (_1.Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function (word, index) {
                callback(new Node(response, name + '[' + index + ']', word));
            });
        }
        return this;
    }
    every(callback) {
        let name = this.name;
        let response = this.response;
        let every = true;
        this.response.startIgnoringAssertions();
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Node(response, name + '[' + index + ']', el);
                if (!callback(element)) {
                    every = false;
                }
            });
        }
        else if (this.isArray()) {
            every = this.obj.every(function (el, index) {
                return callback(new Node(response, name + '[' + index + ']', el));
            });
        }
        else if (this.isObject()) {
            let obj = this.obj;
            every = this.obj.keys().every(function (key) {
                return callback(new Node(response, name + '[' + key + ']', obj[key]));
            });
        }
        else if (this.isString()) {
            every = this.obj.toString().trim().split(' ').every(function (word, index) {
                return callback(new Node(response, name + '[' + index + ']', word));
            });
        }
        this.response.stopIgnoringAssertions();
        this.assert(every, 'Every ' + this.name + ' passed', 'Every ' + this.name + ' did not pass');
        return this;
    }
    some(callback) {
        let name = this.name;
        let response = this.response;
        let some = false;
        this.response.startIgnoringAssertions();
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                let element = new Node(response, name + '[' + index + ']', el);
                if (callback(element)) {
                    some = true;
                }
            });
        }
        else if (this.isArray()) {
            some = this.obj.some(function (el, index) {
                return callback(new Node(response, name + '[' + index + ']', el));
            });
        }
        else if (this.isObject()) {
            let obj = this.obj;
            some = this.obj.keys().some(function (key) {
                return callback(new Node(response, name + '[' + key + ']', obj[key]));
            });
        }
        else if (this.isString()) {
            some = this.obj.toString().trim().split(' ').some(function (word, index) {
                return callback(new Node(response, name + '[' + index + ']', word));
            });
        }
        this.response.stopIgnoringAssertions();
        this.assert(some, 'Some ' + this.name + ' passed', 'No ' + this.name + ' passed');
        return this;
    }
    any(callback) {
        return this.some(callback);
    }
    hasClass(className) {
        if (this.isDomElement()) {
            this.assert(this.obj.hasClass(className), this.name + ' has class ' + className, this.name + ' does not have class ' + className);
        }
        return this;
    }
    greaterThan(value) {
        return this.assert(this.obj > value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    greaterThanOrEquals(value) {
        return this.assert(this.obj >= value, this.name + ' is greater than or equal to ' + value + ' (' + this.obj + ')', this.name + ' is not greater than or equal to ' + value + ' (' + this.obj + ')');
    }
    lessThan(value) {
        return this.assert(this.obj < value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
    }
    lessThanOrEquals(value) {
        return this.assert(this.obj <= value, this.name + ' is less than or equal to ' + value + ' (' + this.obj + ')', this.name + ' is not less than or equal to ' + value + ' (' + this.obj + ')');
    }
    assert(statement, passMessage, failMessage) {
        this.response.assert(statement, passMessage, failMessage);
        return this;
    }
    contains(string) {
        let contains = false;
        if (this.isArray()) {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (this.isObject()) {
            contains = (this.obj.hasOwnProperty(string));
        }
        else if (!this.isNullOrUndefined()) {
            contains = (this.toString().indexOf(string) >= 0);
        }
        return this.assert(contains, this.name + ' contains ' + string, this.name + ' does not contain ' + string);
    }
    contain(string) {
        return this.contains(string);
    }
    matches(pattern) {
        let value = this.toString();
        return this.assert(pattern.test(value), this.name + ' matches ' + String(pattern), this.name + ' does not match ' + String(pattern) + ' (' + value + ')');
    }
    startsWith(matchText) {
        let assert = false;
        let value = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert, this.name + ' starts with ' + matchText, this.name + ' does not start with ' + matchText + ' (' + value + ')');
    }
    endsWith(matchText) {
        let assert = false;
        let value = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert, this.name + ' ends with ' + matchText, this.name + ' does not end with ' + matchText + ' (' + value + ')');
    }
    is(type) {
        let myType = _1.Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()), this.name + ' is type ' + type, this.name + ' is not type ' + type + ' (' + myType + ')');
    }
    exists() {
        let exists = false;
        if (this.isDomElement()) {
            exists = (this.obj.length > 0);
        }
        else if (!this.isNullOrUndefined()) {
            exists = true;
        }
        return this.assert(exists, this.name + ' exists', this.name + ' does not exist');
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
exports.Node = Node;
