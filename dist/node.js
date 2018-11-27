"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const _1 = require(".");
const link_1 = require("./link");
let $ = require('cheerio');
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Generic"] = 0] = "Generic";
    NodeType[NodeType["Element"] = 1] = "Element";
    NodeType[NodeType["StyleAttribute"] = 2] = "StyleAttribute";
    NodeType[NodeType["Property"] = 3] = "Property";
    NodeType[NodeType["Value"] = 4] = "Value";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
class Node {
    constructor(response, name, obj) {
        this.typeOfNode = NodeType.Generic;
        this.selector = null;
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
    tagName() {
        return new Node(this.response, 'Tag of ' + this.name, this.getTagName());
    }
    getTagName() {
        if (this.isDomElement()) {
            return this.obj.get(0).tagName;
        }
        return null;
    }
    getAttribute(name) {
        if (this.isDomElement()) {
            return (typeof this.obj.get(0).attribs[name] !== 'undefined') ?
                this.obj.get(0).attribs[name] : null;
        }
        return null;
    }
    getUrl() {
        if (this.isDomElement()) {
            let tagName = this.getTagName();
            if (tagName !== null) {
                if (['img', 'script', 'video', 'audio', 'object', 'iframe'].indexOf(tagName) >= 0) {
                    return this.getAttribute('src');
                }
                else if (['a', 'link'].indexOf(tagName) >= 0) {
                    return this.getAttribute('href');
                }
                else if (['form'].indexOf(tagName) >= 0) {
                    return this.getAttribute('action') || this.response.scenario.getUrl();
                }
            }
        }
        else if (this.isString()) {
            if (this.response.getType() == response_1.ResponseType.json) {
                return this.toString().trim();
            }
            else if (this.response.getType() == response_1.ResponseType.html) {
                return this.toString().trim().replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
            }
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
            return this.getTagName() === 'a' &&
                this.getAttribute('href') !== null;
        }
        return false;
    }
    isImageElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'img' &&
                this.getAttribute('src') !== null;
        }
        return false;
    }
    isScriptElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'script' &&
                this.getAttribute('src') !== null;
        }
        return false;
    }
    isStylesheetElement() {
        if (this.isDomElement()) {
            return this.getTagName() === 'link' &&
                (this.getAttribute('rel') || '').toLowerCase() == 'stylesheet' &&
                this.getAttribute('href') !== null;
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
        let node = this.response.select(path, findIn);
        node.typeOfNode = NodeType.Value;
        node.selector = path;
        return node;
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
    click(scenarioOrTitle, impliedAssertion = false) {
        let scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        if (this.isLinkElement()) {
            let link = new link_1.Link(this.response, this.getAttribute('href') || '').validate();
            (link.isNavigation()) ?
                scenario.open(link.getUri()) :
                scenario.skip('Not a navigation link');
        }
        else if (this.isButtonElement()) {
            let formNode = new Node(this.response, 'form', this.obj.parents('form'));
            (this.attribute('type').toString().toLowerCase() === 'submit' || !formNode.isFormElement()) ?
                formNode.submit(scenario) :
                scenario.skip('Button does not submit anything');
        }
        else {
            this.fail('Not a clickable element');
            scenario.skip();
        }
        return scenario;
    }
    submit(scenarioOrTitle, impliedAssertion = false) {
        let scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        let link = new link_1.Link(this.response, this.getUrl() || '')
            .validate();
        if (this.isFormElement() && link.isNavigation()) {
            let uri;
            let method = this.getAttribute('method') || 'get';
            scenario.method(method);
            if (method == 'get') {
                uri = link.getUri(this.obj.serializeArray());
            }
            else {
                let formDataArray = this.obj.serializeArray();
                let formData = {};
                uri = link.getUri();
                formDataArray.forEach(function (input) {
                    formData[input.name] = input.value;
                });
                scenario.form(formData);
            }
            scenario.open(uri);
        }
        else {
            scenario.skip('Nothing to submit');
        }
        return scenario;
    }
    fillForm(formData) {
        if (this.isFormElement()) {
            this.comment('Filling out form');
            if (_1.Flagpole.toType(formData) === 'object') {
                let form = this.obj;
                for (let name in formData) {
                    this.assert(form.find('[name="' + name + '"]').val(formData[name]).val() == formData[name], 'Form field ' + name + ' equals ' + formData[name]);
                }
            }
        }
        else {
            this.fail('Not a form');
        }
        return this;
    }
    getLambdaScenario(scenarioOrTitle, impliedAssertion = false) {
        let node = this;
        let scenario = (function () {
            if (typeof scenarioOrTitle == 'string') {
                if (node.isImageElement() ||
                    (node.typeOfNode == NodeType.StyleAttribute && node.selector == 'background-image')) {
                    return node.response.scenario.suite.Image(scenarioOrTitle);
                }
                else if (node.isStylesheetElement()) {
                    return node.response.scenario.suite.Stylesheet(scenarioOrTitle);
                }
                else if (node.isScriptElement()) {
                    return node.response.scenario.suite.Script(scenarioOrTitle);
                }
                else if (node.isFormElement() || node.isClickable()) {
                    return node.response.scenario.suite.Html(scenarioOrTitle);
                }
                else {
                    return node.response.scenario.suite.Resource(scenarioOrTitle);
                }
            }
            return scenarioOrTitle;
        })();
        if (impliedAssertion) {
            scenario.assertions(function () {
            });
        }
        return scenario;
    }
    load(scenarioOrTitle, impliedAssertion = false) {
        let relativePath = this.getUrl();
        let link = new link_1.Link(this.response, relativePath || '').validate();
        let scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        if (relativePath === null) {
            scenario.skip('No URL to load');
        }
        else if (link.isNavigation()) {
            scenario.open(link.getUri());
        }
        else {
            scenario.skip('Nothing to load');
        }
        return scenario;
    }
    find(selector) {
        let node = this.response.select(selector, this.obj);
        node.selector = selector;
        node.typeOfNode = NodeType.Element;
        return node;
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
    slice(start, end) {
        let name = this.name + ' slice(' + start + (end ? ' to ' + end : '') + ')';
        if (this.isDomElement() ||
            this.isArray() ||
            this.isString()) {
            return new Node(this.response, name, this.get().slice(start, end));
        }
        return this;
    }
    css(key) {
        let text = null;
        if (this.isDomElement()) {
            text = this.obj.css(key);
        }
        let node = new Node(this.response, this.name + '[style][' + key + ']', text);
        node.typeOfNode = NodeType.StyleAttribute;
        node.selector = key;
        return node;
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
        this.typeOfNode = NodeType.Property;
        this.selector = key;
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
        this.typeOfNode = NodeType.Property;
        this.selector = key;
        return new Node(this.response, this.name + '[' + key + ']', text);
    }
    prop(key) {
        return this.property(key);
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
        this.typeOfNode = NodeType.Property;
        this.selector = key;
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
        this.typeOfNode = NodeType.Value;
        this.selector = null;
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
    type() {
        return new Node(this.response, 'Type of ' + this.name, _1.Flagpole.toType(this.obj));
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
    decodeURI() {
        let text = decodeURI(this.toString());
        return new Node(this.response, 'Unescaped text of ' + this.name, text);
    }
    decodeURIComponent() {
        let text = decodeURIComponent(this.toString());
        return new Node(this.response, 'Unescaped text of ' + this.name, text);
    }
    encodeURI() {
        let text = encodeURI(this.toString());
        return new Node(this.response, 'Escaped text of ' + this.name, text);
    }
    encodeURIComponent() {
        let text = encodeURIComponent(this.toString());
        return new Node(this.response, 'Escaped text of ' + this.name, text);
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
                callback(new Node(response, name + '[' + index + ']', el), index);
            });
        }
        else if (this.isArray()) {
            this.obj.forEach(function (el, index) {
                callback(new Node(response, name + '[' + index + ']', el), index);
            });
        }
        else if (_1.Flagpole.toType(this.obj) == 'object') {
            let obj = this.obj;
            this.obj.keys().forEach(function (key) {
                callback(new Node(response, name + '[' + key + ']', obj[key]), key);
            });
        }
        else if (_1.Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function (word, index) {
                callback(new Node(response, name + '[' + index + ']', word), index);
            });
        }
        return this;
    }
    every(callback) {
        let name = this.name;
        let response = this.response;
        let every = true;
        let node = this;
        this.response.ignore(function () {
            if (node.isDomElement()) {
                node.obj.each(function (index, el) {
                    el = $(el);
                    let element = new Node(response, name + '[' + index + ']', el);
                    if (!callback(element)) {
                        every = false;
                    }
                });
            }
            else if (node.isArray()) {
                every = node.obj.every(function (el, index) {
                    return callback(new Node(response, name + '[' + index + ']', el));
                });
            }
            else if (node.isObject()) {
                let obj = node.obj;
                every = node.obj.keys().every(function (key) {
                    return callback(new Node(response, name + '[' + key + ']', obj[key]));
                });
            }
            else if (node.isString()) {
                every = node.obj.toString().trim().split(' ').every(function (word, index) {
                    return callback(new Node(response, name + '[' + index + ']', word));
                });
            }
        });
        this.assert(every, 'Every ' + this.name + ' passed');
        return this;
    }
    some(callback) {
        let name = this.name;
        let response = this.response;
        let some = false;
        let node = this;
        this.response.ignore(function () {
            if (node.isDomElement()) {
                node.obj.each(function (index, el) {
                    el = $(el);
                    let element = new Node(response, name + '[' + index + ']', el);
                    if (callback(element)) {
                        some = true;
                    }
                });
            }
            else if (node.isArray()) {
                some = node.obj.some(function (el, index) {
                    return callback(new Node(response, name + '[' + index + ']', el));
                });
            }
            else if (node.isObject()) {
                let obj = node.obj;
                some = node.obj.keys().some(function (key) {
                    return callback(new Node(response, name + '[' + key + ']', obj[key]));
                });
            }
            else if (node.isString()) {
                some = node.obj.toString().trim().split(' ').some(function (word, index) {
                    return callback(new Node(response, name + '[' + index + ']', word));
                });
            }
        });
        this.assert(some, 'Some ' + this.name + ' passed');
        return this;
    }
    any(callback) {
        return this.some(callback);
    }
    hasClass(className) {
        if (this.isDomElement()) {
            this.assert(this.obj.hasClass(className), this.name + ' has class ' + className);
        }
        return this;
    }
    greaterThan(value) {
        return this.assert(this.obj > value, this.name + ' is greater than ' + value + ' (' + this.obj + ')');
    }
    greaterThanOrEquals(value) {
        return this.assert(this.obj >= value, this.name + ' is greater than or equal to ' + value + ' (' + this.obj + ')');
    }
    lessThan(value) {
        return this.assert(this.obj < value, this.name + ' is less than ' + value + ' (' + this.obj + ')');
    }
    lessThanOrEquals(value) {
        return this.assert(this.obj <= value, this.name + ' is less than or equal to ' + value + ' (' + this.obj + ')');
    }
    between(minValue, maxValue) {
        return this.assert(this.obj >= minValue && this.obj <= maxValue, this.name + ' is between ' + minValue + ' and ' + maxValue + ' (' + this.obj + ')');
    }
    assert(statement, message, actualValue) {
        this.response.assert(statement, message, actualValue);
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
        return this.assert(contains, this.name + ' contains "' + string + '"');
    }
    contain(string) {
        return this.contains(string);
    }
    matches(pattern) {
        let value = this.toString();
        return this.assert(pattern.test(value), this.name + ' matches ' + String(pattern), value);
    }
    startsWith(matchText) {
        let assert = false;
        let value = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert, this.name + ' starts with "' + matchText + '"', matchText);
    }
    endsWith(matchText) {
        let assert = false;
        let value = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert, this.name + ' ends with "' + matchText + '"', matchText);
    }
    is(type) {
        let myType = _1.Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()), this.name + ' is type ' + type, myType);
    }
    exists() {
        let exists = false;
        if (this.isDomElement()) {
            exists = (this.obj.length > 0);
        }
        else if (!this.isNullOrUndefined()) {
            exists = true;
        }
        return this.assert(exists, this.name + ' exists');
    }
    equals(value, permissiveMatching = false) {
        let matchValue = this.toString();
        let equals = 'equals';
        let messageValue = (typeof value == 'string') ? '"' + value + '"' : value;
        if (permissiveMatching) {
            value = value.toLowerCase().trim();
            matchValue = matchValue.toLowerCase().trim();
            equals = 'is similar to';
        }
        return this.assert(matchValue == value, this.name + ' ' + equals + ' ' + messageValue, matchValue);
    }
    similarTo(value) {
        return this.equals(value, true);
    }
    in(arrayOfValues) {
        let value = this.toString();
        return this.assert(arrayOfValues.indexOf(value) >= 0, this.name + ' is in list: ' + arrayOfValues.join(','), value);
    }
}
exports.Node = Node;
