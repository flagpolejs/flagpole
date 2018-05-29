"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const property_1 = require("./property");
const value_1 = require("./value");
class Element extends property_1.Property {
    constructor(response, name, obj) {
        super(response, name, obj);
    }
    and() {
        return this.response.and();
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
            text = this.obj[key].toString();
        }
        return new value_1.Value(this.response, this.name + '[' + key + ']', text);
    }
    property(key) {
        let text = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new value_1.Value(this.response, this.name + '[' + key + ']', text);
    }
    data(key) {
        let text = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key].toString();
        }
        return new value_1.Value(this.response, this.name + '[' + key + ']', text);
    }
    val() {
        let text = null;
        if (index_1.Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!index_1.Flagpole.isNullOrUndefined(this.obj)) {
            text = String(this.obj);
        }
        return new value_1.Value(this.response, 'Value of ' + this.name, text);
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
