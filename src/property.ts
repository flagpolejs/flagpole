import { Flagpole, iResponse } from "./index";
import { Scenario } from "./scenario";

let cheerio = require('cheerio');
let $ = cheerio;

export interface iProperty {
    toString(): string
    get(): any
    echo(): iProperty
    typeof(): iProperty
    select(path: string, findIn?: any): Element
    text(): Value
    length(): Value
    trim(): Value
    toLowerCase(): Value
    toUpperCase(): Value
    parseInt(): Value
    parseFloat(): Value
    headers(key?: string): Value
    replace(search: string|RegExp, replace: string): Value
    not(): iResponse
    label(message: string): iResponse
    comment(message: string): iResponse
    each(callback: Function): iResponse
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse
    exists(): iResponse
    is(type: string): iResponse
    contains(string: string): iResponse
    matches(pattern: RegExp): iResponse
    startsWith(matchText: string): iResponse
    endsWith(matchText: string): iResponse
    greaterThan(value: number): iResponse
    greaterThanOrEquals(value: number): iResponse
    lessThan(value: number): iResponse
    lessThanOrEquals(value: number): iResponse
    equals(value: any, permissiveMatching: boolean): iResponse
    similarTo(value: any): iResponse
    and(): Element
}

/**
 * Generic property that is selected. It could be an element or a value
 */
export abstract class Property implements iProperty {

    protected response: iResponse;
    protected name: string;
    protected obj: any;

    constructor(response: iResponse, name: string, obj: any) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }

    public assert(statement: boolean, passMessage: string, failMessage: string): iResponse {
        return this.response.assert(statement, passMessage, failMessage);
    }

    /**
     * Just mapping this to response.and() to facilitate chaining
     *
     * @returns {Element}
     */
    public and(): Element {
        return this.response.and();
    }

    /**
     * Flip the next assertion
     *
     * @returns {iResponse}
     */
    public not(): iResponse {
        return this.response.not();
    }

    /**
     * Sometimes we need to get the actual string
     *
     * @returns {string}
     */
    public toString(): string {
        if ((Flagpole.toType(this.obj) == 'cheerio')) {
            return this.obj.text().toString();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.toString) {
            return this.obj.toString();
        }
        else {
            return String(this.obj);
        }
    }

    /**
     * Get the raw object
     *
     * @returns any
     */
    public get(): any {
        return this.obj;
    }

    /**
     * Get the text value of this object
     *
     * @returns {Value}
     */
    public text(): Value {
        let text: string = this.toString();
        let name: string = 'Text of ' + this.name;
        let value: Value = new Value(this.response, name, text);
        value.length().greaterThan(0);
        return value;
    }

    /**
     * Write a message for a passing assertion
     *
     * @param {string} message
     */
    protected pass(message: string): Scenario {
        return this.response.scenario.pass(message);
    }

    /**
     * Write message for a failing assertion
     *
     * @param {string} message
     */
    protected fail(message: string): Scenario {
        return this.response.scenario.fail(message);
    }

    /**
     * Write message for a comment
     *
     * @param {string} message
     */
    public comment(message: string): iResponse {
        this.response.scenario.comment(message);
        return this.response;
    }

    /**
     * Override the default message for this test so we can have a custom message that is more human readable
     *
     * @param {string} message
     * @returns {iProperty}
     */
    public label(message: string): iResponse {
        this.response.label(message);
        return this.response;
    }

    /**
     * Find the number of elements in array or length of a string
     *
     * @returns {Value}
     */
    public length(): Value {
        let count: number = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Value(this.response, 'Length of ' + this.name, count);
    }

    /**
     * Does this object contain this? Works for strings, arrays, and objects alike
     *
     * @param {string} string
     * @returns {iResponse}
     */
    public contains(string: string): iResponse {
        let contains: boolean = false;
        if (Flagpole.toType(this.obj) == 'array') {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            contains = (this.obj.hasOwnProperty(string));
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            contains = (this.toString().indexOf(string) >= 0);
        }
        return this.assert(contains,
            this.name + ' contains ' + string,
            this.name + ' does not contain ' + string
        );
    }

    /**
     * Test with regular expression
     *
     * @param {RegExp} pattern
     * @returns {iResponse}
     */
    public matches(pattern: RegExp) {
        let value: string = this.toString();
        return this.assert(pattern.test(value),
            this.name + ' matches ' + String(pattern),
            this.name + ' does not match ' + String(pattern) + ' (' + value + ')'
        );
    }

    /**
     * Does it start with this value?
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public startsWith(matchText: string): iResponse {
        let assert: boolean = false;
        let value: string = '';
        if (!Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert,
            this.name + ' starts with ' + matchText,
            this.name + ' does not start with ' + matchText + ' (' + value + ')'
        );
    }

    /**
     * Does this end with this value?
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public endsWith(matchText: string): iResponse {
        let assert: boolean = false;
        let value: string = '';
        if (!Flagpole.isNullOrUndefined(this.obj)) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert,
            this.name + ' ends with ' + matchText,
            this.name + ' does not end with ' + matchText + ' (' + value + ')'
        );
    }

    /**
     * Trim extra whitespace around the string value
     *
     * @returns {Value}
     */
    public trim(): Value {
        let text: string = this.toString().trim();
        return new Value(this.response, 'Trimmed text of ' + this.name, text);
    }

    /**
     * Lowercase the string value
     *
     * @returns {Value}
     */
    public toLowerCase(): Value {
        let text: string = this.toString().toLowerCase();
        return new Value(this.response, 'Lowercased text of ' + this.name, text);
    }

    /**
     * Uppercase the string value
     *
     * @returns {Value}
     */
    public toUpperCase(): Value {
        let text: string = this.toString().toUpperCase();
        return new Value(this.response, 'Uppercased text of ' + this.name, text);
    }

    /**
     * Replace the string value
     *
     * @param {string | RegExp} search
     * @param {string} replace
     * @returns {Value}
     */
    public replace(search: string|RegExp, replace: string): Value {
        let text: string = this.toString().replace(search, replace);
        return new Value(this.response, 'Replaced text of ' + this.name, text);
    }

    /**
     * Does this objects type match this?
     *
     * @param {string} type
     * @returns {iResponse}
     */
    public is(type: string): iResponse {
        let myType: string = Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()),
            this.name + ' is type ' + type,
            this.name + ' is not type ' + type + ' (' + myType + ')'
        );
    }

    /**
     * For debugging, just spit out a value
     *
     * @returns {iProperty}
     */
    public echo(): iProperty {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }

    /**
     * For debugging, just spit out this object's type
     *
     * @returns {iProperty}
     */
    public typeof(): iProperty {
        this.comment('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this;
    }

    /**
     * Loop through it
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public each(callback: Function): iResponse {
        let name: string = this.name;
        let response: iResponse = this.response;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            this.obj.each(function(index, el) {
                el = $(el);
                let element: Element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (Flagpole.toType(this.obj) == 'array') {
            this.obj.forEach(function(el, index) {
                let element: Element = new Element(response, name + '[' + index + ']', el);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            let obj: {} = this.obj;
            this.obj.keys().forEach(function(key) {
                let element: Element = new Element(response, name + '[' + key + ']', obj[key]);
                response.lastElement(element);
                callback(element);
            });
        }
        else if (Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function(word, index) {
                let value: Value = new Value(response, name + '[' + index + ']', word);
                callback(value);
            });
        }
        return this.response;
    }

    /**
     * Does this element exist?
     *
     * @returns {iResponse}
     */
    public exists(): iResponse {
        let exists: boolean = false;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            exists = (this.obj.length > 0);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            exists = true;
        }
        return this.assert(exists,
            this.name + ' exists',
            this.name + ' does not exist'
        );
    }

    /**
     * Get the integer value of this object
     *
     * @returns {Value}
     */
    public parseInt(): Value {
        let num: number|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseInt(this.obj.text());
        }
        else {
            num = parseInt(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }

    /**
     * Get the float/double value of this object
     *
     * @returns {Value}
     */
    public parseFloat(): Value {
        let num: number|null = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            num = parseFloat(this.obj.text());
        }
        else {
            num = parseFloat(this.obj);
        }
        return new Value(this.response, 'Text of ' + this.name, num);
    }

    public headers(key?: string): Value  {
        return this.response.headers(key);
    }

    select(path: string, findIn?: any): Element {
        return this.response.select(path, findIn);
    }

    /**
     * Is this object's value greater than this?
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThan(value: number): iResponse {
        return this.assert(this.obj > value,
            this.name + ' is greater than ' + value + ' (' + this.obj + ')',
            this.name + ' is not greater than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     *  Is this object's value greater than or equal to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public greaterThanOrEquals(value: any): iResponse {
        return this.assert(this.obj >= value,
            this.name + ' is greater than ' + value + ' (' + this.obj + ')',
            this.name + ' is not greater than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     * Is this object's value less than this?
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThan(value: number): iResponse {
        return this.assert(this.obj < value,
            this.name + ' is less than ' + value + ' (' + this.obj + ')',
            this.name + ' is not less than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     * Is this object's value less or equal to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public lessThanOrEquals(value: any): iResponse {
        return this.assert(this.obj <= value,
            this.name + ' is less than ' + value + ' (' + this.obj + ')',
            this.name + ' is not less than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     *  Is this object's value equal to this?
     *
     * @param value
     * @param {boolean} permissiveMatching
     * @returns {iResponse}
     */
    public equals(value: any, permissiveMatching: boolean = false): iResponse {
        let matchValue: string = this.toString();
        let positiveCase: string = 'equals';
        let negativeCase: string = 'does not equal';
        if (permissiveMatching) {
            value = value.toLowerCase().trim();
            matchValue = matchValue.toLowerCase().trim();
            positiveCase = 'is similar to';
            negativeCase = 'is not similar to';
        }
        return this.assert(matchValue == value,
            this.name + ' ' + positiveCase + ' ' + value,
            this.name + ' ' + negativeCase + ' ' + value + ' (' + matchValue + ')'
        );
    }

    /**
     * Is this object's value similar to this?
     *
     * @param value
     * @returns {iResponse}
     */
    public similarTo(value: any): iResponse {
        return this.equals(value, true);
    }

}


export class Value extends Property implements iProperty {


}


/**
 * Various different types of properties that assertions can be made against
 */
export class Element extends Property implements iProperty {

    constructor(response: iResponse, name: string, obj: any) {
        super(response, name, obj);
    }

    /**
     * Click on this link (kick off another scenario)
     *
     * @param {Scenario} nextScenario
     * @returns {Element}
     */
    public click(nextScenario: Scenario): Element {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            let href: string = this.attribute('href').toString();
            // Need more logic here to handle relative links
            if (!nextScenario.isDone()) {
                nextScenario.open(href).execute();
            }
        }
        return this;
    }

    /**
     * Find a child element of the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public find(selector: string): Element {
        return this.response.select(selector, this.obj);
    }

    /**
     * Find the next element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public next(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.next(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find the previous element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public prev(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.prev(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Going up the object model, find the closest matching element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public closest(selector: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.closest(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find a matching parent element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public parents(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.parents(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find matching sibling elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public siblings(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.siblings(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Find matching child elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Element}
     */
    public children(selector?: string): Element {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            obj = this.obj.children(selector);
        }
        return this.response.lastElement(new Element(this.response, name, obj));
    }

    /**
     * Alias for nth because it's what jQuery uses even though it's a stupid name
     *
     * @param {number} i
     * @returns {Element}
     */
    public eq(i: number): Element {
        return this.nth(i);
    }

    /**
     * Select the nth value or an array or collection
     *
     * @param {number} i
     * @returns {Element}
     */
    public nth(i: number): Element {
        let obj: any = null;
        if (i >= 0) {
            if (Flagpole.toType(this.obj) == 'array') {
                obj = this.obj[i];
            }
            else if (Flagpole.toType(this.obj) == 'cheerio') {
                obj = this.obj.eq(i);
            }
        }
        return this.response.lastElement(new Element(this.response, this.name + '[' + i + ']', obj));
    }

    /**
     * Get the first element in the array
     *
     * @returns {Element}
     */
    public first(): Element {
        return this.nth(0);
    }

    /**
     * Get the last element in the array
     *
     * @returns {Element}
     */
    public last(): Element {
        return this.nth(
            (this.obj && this.obj.length) ? (this.obj.length - 1) : -1
        );
    }

    /**
     * Get the attribute by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public attribute(key: string): Value {
        let text: any = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.attr(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the property by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public property(key: string): Value {
        let text: any;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.prop(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the data attribute by name of this object
     *
     * @param {string} key
     * @returns {Value}
     */
    public data(key: string): Value {
        let text: any = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.data(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.obj.hasOwnProperty && this.obj.hasOwnProperty(key)) {
            text = this.obj[key];
        }
        return new Value(this.response,  this.name + '[' + key + ']', text);
    }

    /**
     * Get the value of this object
     *
     * @returns {Value}
     */
    public val(): Value {
        let text: any = null;
        if (Flagpole.toType(this.obj) == 'cheerio') {
            text = this.obj.val();
        }
        else if (!Flagpole.isNullOrUndefined(this.obj)) {
            text = this.obj;
        }
        return new Value(this.response, 'Value of ' + this.name, text);
    }

    /* ASSERTIONS */

    /**
     * Does this element have this class name?
     *
     * @param {string} className
     * @returns {iResponse}
     */
    public hasClass(className: string): iResponse {
        if (Flagpole.toType(this.obj) == 'cheerio') {
            return this.assert(this.obj.hasClass(className),
                this.name + ' has class ' + className,
                this.name + ' does not have class ' + className
            );
        }
        return this.response;
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThan(value: number): iResponse {
        return this.parseFloat().greaterThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThanOrEquals(value: number): iResponse {
        return this.parseFloat().greaterThanOrEquals(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThan(value: number): iResponse {
        return this.parseFloat().lessThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThanOrEquals(value: number): iResponse {
        return this.parseFloat().lessThanOrEquals(value);
    }

    /**
     *
     * @param value
     * @param {boolean} permissiveMatching
     * @returns {iResponse}
     */
    public equals(value: any, permissiveMatching: boolean = false): iResponse {
        return this.text().equals(value, permissiveMatching);
    }

    /**
     *
     * @param value
     * @returns {iResponse}
     */
    public similarTo(value: any): iResponse {
        return this.text().similarTo(value);
    }

}