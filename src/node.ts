import { Scenario } from "./scenario";
import { iResponse } from "./response";
import { Flagpole } from ".";

let $: CheerioStatic = require('cheerio');

/**
 * Various different types of properties that assertions can be made against
 */
export class Node {

    protected response: iResponse;
    protected name: string;
    protected obj: any;

    constructor(response: iResponse, name: string, obj: any) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }

    /**
     * Select another element.
     * 
     * @param path 
     * @param findIn 
     */
    public select(path: string, findIn?: any): Node {
        return this.response.select(path, findIn);
    }

    /**
    * Just mapping this to response.and() to facilitate chaining
    *
    * @returns {Node}
    */
    public and(): Node {
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
     * Test the raw object to see if its nullish
     */
    public isNullOrUndefined(): boolean {
        return Flagpole.isNullOrUndefined(this.obj);
    }

    /**
     * Is this node a DOM Element?
     */
    public isDomElement(): boolean {
        return (Flagpole.toType(this.obj) == 'cheerio');
    }

    public getTagName(): string | null {
        if (this.isDomElement()) {
            return this.obj.get(0).tagName;
        }
        return null;
    }

    /**
     * Check if the underlying html element is a form tag
     */
    public isFormElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'form';
        }
        return false;
    }

    /**
     * Check if the underlying html element is a button tag
     */
    public isButtonElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'button';
        }
        return false;
    }

    /**
     * Check if the underlying html element is an a tag
     */
    public isLinkElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'a';
        }
        return false;
    }

    /**
     * Is this element one we can fake click on?
     */
    public isClickable(): boolean {
        return (this.isLinkElement() || this.isButtonElement());
    }

    /**
     * 
     */
    public isArray(): boolean {
        return Flagpole.toType(this.obj) == 'array';
    }

    /**
     * 
     */
    public isString(): boolean {
        return Flagpole.toType(this.obj) == 'string';
    }

    /**
     * 
     */
    public isObject(): boolean {
        return Flagpole.toType(this.obj) == 'object';
    }

    /**
     * 
     * @param key 
     */
    public hasProperty(key: string): boolean {
        return this.obj.hasOwnProperty && this.obj.hasOwnProperty(key);
    }

    /**
     * Get the raw object
     *
     * @returns any
     */
    public get(index?: number): any {
        if (typeof index !== 'undefined') {
            if (this.isArray()) {
                return this.obj[index];
            } 
            else if (this.isDomElement()) {
                return this.obj.eq(index);
            }
        }
        // Still here? return it all
        return this.obj;
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
     * @returns {iResponse}
     */
    public label(message: string): iResponse {
        this.response.label(message);
        return this.response;
    }

    /**
     * For debugging, just spit out a value
     *
     * @returns {Node}
     */
    public echo(): Node {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }

    /**
     * For debugging, just spit out this object's type
     *
     * @returns {Node}
     */
    public typeof(): Node {
        this.comment('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this;
    }

    /**
     * Returns header from the main response
     * 
     * @param key 
     */
    public headers(key?: string): Node {
        return this.response.headers(key);
    }

    /**
     * SIMULATED ACTIONS
     */

    /**
     * Click on this link (kick off another scenario)
     *
     * @param {Scenario} nextScenario
     */
    public click(nextScenario: Scenario): Node {
        // If this was a link, click it and then run the resulting scenaior
        if (this.isLinkElement()) {
            let href: string = this.attribute('href').toString();
            // Need more logic here to handle relative links
            if (href && !nextScenario.isDone()) {
                nextScenario.open(href).execute();
            }
        }
        // If this was a button and it has a form to submit... submit that form
        else if (this.isButtonElement()) {
            if (this.attribute('type').toString().toLowerCase() === 'submit') {
                let formNode: Node = new Node(this.response, 'form', this.obj.parents('form'));
                formNode.submit(nextScenario);
            }
        }
        else {
            this.fail('Not a clickable element');
        }
        return this;
    }

    /**
     * Simulate form submission
     * 
     * @param nextScenario 
     */
    public submit(nextScenario: Scenario): Node {
        if (this.isFormElement()) {
            // If there is an action or else submit to self
            let action: string = this.obj.attr('action') || this.response.scenario.getUrl() || '';
            if (action.length > 0) {
                let method: string = this.obj.attr('method') || 'get';
                nextScenario.method(method);
                if (method == 'get') {
                    action = action.split('?')[0] + '?' + this.obj.serialize();
                }
                else {
                    let formDataArray: any[] = this.obj.serializeArray();
                    let formData: any = {};
                    formDataArray.forEach(function (input: any) {
                        formData[input.name] = input.value;
                    });
                    nextScenario.form(formData)
                }
                // Need more logic here to handle relative links
                if (!nextScenario.isDone()) {
                    this.comment('Submitting form');
                    nextScenario.open(action).execute();
                }
            }
        }
        return this;
    }

    /**
     * 
     * @param formData 
     */
    public fillForm(formData: any): Node {
        if (this.isFormElement()) {
            this.comment('Filling out form');
            if (Flagpole.toType(formData) === 'object') {
                let form: Cheerio = this.obj;
                for (let name in formData) {
                    this.assert(
                        form.find('[name="' + name + '"]').val(formData[name]).val() == formData[name],
                        'Form field ' + name + ' equals ' + formData[name],
                        'Form field ' + name + ' does not equal ' + formData[name]
                    );
                }
            }
        }
        else {
            this.fail('Not a form');
        }
        return this;
    }

    /**
     * DOM TRAVERSAL
     */

    public find(selector: string): Node {
        return this.response.select(selector, this.obj);
    }

    public closest(selector: string): Node {
        return this.response.closest(selector);
    }

    public parents(selector?: string): Node {
        return this.response.parents(selector);
    }

    public parent(): Node {
        return this.response.parent();
    }

    public siblings(selector): Node {
        return this.response.siblings(selector);
    }

    public children(selector): Node {
        return this.response.siblings(selector);
    }

    public next(selector): Node {
        return this.response.next(selector);
    }

    public prev(selector): Node {
        return this.response.prev(selector);
    }

    /**
     * Alias for nth because it's what jQuery uses even though it's a stupid name
     *
     * @param {number} i
     * @returns {Node}
     */
    public eq(i: number): Node {
        return this.nth(i);
    }

    /**
     * Select the nth value or an array or collection
     *
     * @param {number} i
     * @returns {Node}
     */
    public nth(i: number): Node {
        let obj: any = null;
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

    /**
     * Get the first element in the array
     *
     * @returns {Node}
     */
    public first(): Node {
        return this.nth(0);
    }

    /**
     * Get the last element in the array
     *
     * @returns {Node}
     */
    public last(): Node {
        return this.nth(
            (this.obj && this.obj.length) ? (this.obj.length - 1) : -1
        );
    }

    /**
     * PROPERTIES AND ATTRIBUTES
     */

    /**
     * Get the attribute by name of this object
     *
     * @param {string} key
     * @returns {Node}
     */
    public attribute(key: string): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.attr(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.hasProperty(key)) {
            text = this.obj[key];
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }

    /**
     * Get the property by name of this object
     *
     * @param {string} key
     * @returns {Node}
     */
    public property(key: string): Node {
        let text: any;
        if (this.isDomElement()) {
            text = this.obj.prop(key);
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            text = this.obj[key];
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }

    /**
     * Get the data attribute by name of this object
     *
     * @param {string} key
     * @returns {Node}
     */
    public data(key: string): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.data(key);
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            text = this.obj[key];
        }
        return new Node(this.response, this.name + '[' + key + ']', text);
    }

    /**
     * Get the value of this object
     *
     * @returns {Node}
     */
    public val(): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.val();
        }
        else if (!this.isNullOrUndefined()) {
            text = this.obj;
        }
        return new Node(this.response, 'Value of ' + this.name, text);
    }

    /**
    * Get the value of this object
    *
    * @returns {Node}
    */
    public text(): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.text();
        }
        else if (!this.isNullOrUndefined()) {
            text = this.obj.toString();
        }
        return new Node(this.response, 'Text of ' + this.name, text);
    }

    /**
     * Find the number of elements in array or length of a string
     *
     * @returns {Node}
     */
    public length(): Node {
        let count: number = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Node(this.response, 'Length of ' + this.name, count);
    }

    /**
     * Get the float/double value of this object
     *
     * @returns {Node}
     */
    public parseFloat(): Node {
        return new Node(this.response, 'Float of ' + this.name, parseFloat(this.toString()));
    }

    /**
     * Get the integer value of this object
     *
     * @returns {Node}
     */
    public parseInt(): Node {
        return new Node(this.response, 'Integer of ' + this.name, parseInt(this.toString()));
    }

    /**
     * Trim extra whitespace around the string value
     *
     * @returns {Node}
     */
    public trim(): Node {
        let text: string = this.toString().trim();
        return new Node(this.response, 'Trimmed text of ' + this.name, text);
    }

    /**
     * Lowercase the string value
     *
     * @returns {Node}
     */
    public toLowerCase(): Node {
        let text: string = this.toString().toLowerCase();
        return new Node(this.response, 'Lowercased text of ' + this.name, text);
    }

    /**
     * Uppercase the string value
     *
     * @returns {Node}
     */
    public toUpperCase(): Node {
        let text: string = this.toString().toUpperCase();
        return new Node(this.response, 'Uppercased text of ' + this.name, text);
    }

    /**
     * Replace the string value
     *
     * @param {string | RegExp} search
     * @param {string} replace
     * @returns {Node}
     */
    public replace(search: string | RegExp, replace: string): Node {
        let text: string = this.toString().replace(search, replace);
        return new Node(this.response, 'Replaced text of ' + this.name, text);
    }

    /**
    * Sometimes we need to get the actual string
    *
    * @returns {string}
    */
    public toString(): string {
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

    /**
     * LOOPS
     */

    /**
     * Loop through it
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public each(callback: Function): iResponse {
        let name: string = this.name;
        let response: iResponse = this.response;
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                callback(
                    new Node(response, name + '[' + index + ']', el)
                );
            });
        }
        else if (this.isArray()) {
            this.obj.forEach(function (el, index) {
                callback(
                    new Node(response, name + '[' + index + ']', el)
                );
            });
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            let obj: {} = this.obj;
            this.obj.keys().forEach(function (key) {
                callback(
                    new Node(response, name + '[' + key + ']', obj[key])
                );
            });
        }
        else if (Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function (word, index) {
                callback(
                    new Node(response, name + '[' + index + ']', word)
                );
            });
        }
        return this.response;
    }

    /**
     * Loops through the element and expects the return from every callback to be true
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public every(callback: Function): iResponse {
        let name: string = this.name;
        let response: iResponse = this.response;
        let every: boolean = true;
        this.response.startIgnoringAssertions();
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                let element: Node = new Node(response, name + '[' + index + ']', el);
                if (!callback(element)) {
                    every = false;
                }
            });
        }
        else if (this.isArray()) {
            every = this.obj.every(function (el, index) {
                return callback(
                    new Node(response, name + '[' + index + ']', el)
                );
            });
        }
        else if (this.isObject()) {
            let obj: {} = this.obj;
            every = this.obj.keys().every(function (key) {
                return callback(
                    new Node(response, name + '[' + key + ']', obj[key])
                );
            });
        }
        else if (this.isString()) {
            every = this.obj.toString().trim().split(' ').every(function (word, index) {
                return callback(
                    new Node(response, name + '[' + index + ']', word)
                );
            });
        }
        this.response.stopIgnoringAssertions();
        return this.assert(every,
            'Every ' + this.name + ' passed',
            'Every ' + this.name + ' did not pass'
        );
    }

    /**
     * Loops through the element and expects the return from every callback to be true
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public some(callback: Function): iResponse {
        let name: string = this.name;
        let response: iResponse = this.response;
        let some: boolean = false;
        this.response.startIgnoringAssertions();
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                let element: Node = new Node(response, name + '[' + index + ']', el);
                if (callback(element)) {
                    some = true;
                }
            });
        }
        else if (this.isArray()) {
            some = this.obj.some(function (el, index) {
                return callback(
                    new Node(response, name + '[' + index + ']', el)
                );
            });
        }
        else if (this.isObject()) {
            let obj: {} = this.obj;
            some = this.obj.keys().some(function (key) {
                return callback(
                    new Node(response, name + '[' + key + ']', obj[key])
                );
            });
        }
        else if (this.isString()) {
            some = this.obj.toString().trim().split(' ').some(function (word, index) {
                return callback(
                    new Node(response, name + '[' + index + ']', word)
                );
            });
        }
        this.response.stopIgnoringAssertions();
        return this.assert(some,
            'Some ' + this.name + ' passed',
            'No ' + this.name + ' passed'
        );
    }

    /**
     * Alias for some
     * 
     * @param callback 
     */
    public any(callback: Function): iResponse {
        return this.some(callback);
    }

    /**
     * ASSERTIONS 
     */

    /**
     * Does this element have this class name?
     *
     * @param {string} className
     * @returns {iResponse}
     */
    public hasClass(className: string): iResponse {
        if (this.isDomElement()) {
            return this.assert(this.obj.hasClass(className),
                this.name + ' has class ' + className,
                this.name + ' does not have class ' + className
            );
        }
        return this.response;
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
            this.name + ' is greater than or equal to ' + value + ' (' + this.obj + ')',
            this.name + ' is not greater than or equal to ' + value + ' (' + this.obj + ')'
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
            this.name + ' is less than or equal to ' + value + ' (' + this.obj + ')',
            this.name + ' is not less than or equal to ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     * Make an assertion
     * 
     * @param statement 
     * @param passMessage 
     * @param failMessage 
     */
    public assert(statement: boolean, passMessage: string, failMessage: string): iResponse {
        return this.response.assert(statement, passMessage, failMessage);
    }

    /**
     * Does this object contain this? Works for strings, arrays, and objects alike
     *
     * @param {string} string
     */
    public contains(string: string): iResponse {
        let contains: boolean = false;
        if (this.isArray()) {
            contains = (this.obj.indexOf(string) >= 0);
        }
        else if (this.isObject()) {
            contains = (this.obj.hasOwnProperty(string));
        }
        else if (!this.isNullOrUndefined()) {
            contains = (this.toString().indexOf(string) >= 0);
        }
        return this.assert(contains,
            this.name + ' contains ' + string,
            this.name + ' does not contain ' + string
        );
    }

    /**
     * Alias for contains
     * 
     * @param string 
     */
    public contain(string: string): iResponse {
        return this.contains(string);
    }

    /**
     * Test with regular expression
     *
     * @param {RegExp} pattern
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
        if (!this.isNullOrUndefined()) {
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
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert,
            this.name + ' ends with ' + matchText,
            this.name + ' does not end with ' + matchText + ' (' + value + ')'
        );
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
     * Does this element exist?
     *
     * @returns {iResponse}
     */
    public exists(): iResponse {
        let exists: boolean = false;
        if (this.isDomElement()) {
            exists = (this.obj.length > 0);
        }
        else if (!this.isNullOrUndefined()) {
            exists = true;
        }
        return this.assert(exists,
            this.name + ' exists',
            this.name + ' does not exist'
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