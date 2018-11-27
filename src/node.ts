import { Scenario } from "./scenario";
import { iResponse, ResponseType } from "./response";
import { Flagpole } from ".";
import { Link } from "./link";

let $: CheerioStatic = require('cheerio');

export enum NodeType {
    Generic,
    Element,
    StyleAttribute,
    Property,
    Value
}

/**
 * Various different types of properties that assertions can be made against
 */
export class Node {

    protected response: iResponse;
    protected name: string;
    protected obj: any;

    protected typeOfNode: NodeType = NodeType.Generic;
    protected selector: string | null = null;

    constructor(response: iResponse, name: string, obj: any) {
        this.response = response;
        this.name = name;
        this.obj = obj;
    }

    /**
    * Test the raw object to see if its nullish
    */
    protected isNullOrUndefined(): boolean {
        return Flagpole.isNullOrUndefined(this.obj);
    }

    /**
     * Is this node a DOM Element?
     */
    protected isDomElement(): boolean {
        return (Flagpole.toType(this.obj) == 'cheerio');
    }

    public tagName(): Node {
        return new Node(this.response, 'Tag of ' + this.name, this.getTagName());
    }

    protected getTagName(): string | null {
        if (this.isDomElement()) {
            return this.obj.get(0).tagName;
        }
        return null;
    }

    protected getAttribute(name: string): string | null {
        if (this.isDomElement()) {
            return (typeof this.obj.get(0).attribs[name] !== 'undefined') ?
                this.obj.get(0).attribs[name] : null;
        }
        return null;
    }

    protected getUrl(): string | null {
        if (this.isDomElement()) {
            let tagName: string | null = this.getTagName();
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
            if (this.response.getType() == ResponseType.json) {
                return this.toString().trim();
            }
            else if (this.response.getType() == ResponseType.html) {
                return this.toString().trim().replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
            }
        }
        return null;
    }

    /**
     * Check if the underlying html element is a form tag
     */
    protected isFormElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'form';
        }
        return false;
    }

    /**
     * Check if the underlying html element is a button tag
     */
    protected isButtonElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'button';
        }
        return false;
    }

    /**
     * Check if the underlying html element is an a tag
     */
    protected isLinkElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'a' &&
                this.getAttribute('href') !== null;
        }
        return false;
    }

    protected isImageElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'img' && 
                this.getAttribute('src') !== null;
        }
        return false;
    }

    protected isScriptElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'script' &&
                this.getAttribute('src') !== null;
        }
        return false;
    }

    protected isStylesheetElement(): boolean {
        if (this.isDomElement()) {
            return this.getTagName() === 'link' &&
                (this.getAttribute('rel') || '').toLowerCase() == 'stylesheet' &&
                this.getAttribute('href') !== null
        }
        return false;
    }

    /**
     * Is this element one we can fake click on?
     */
    protected isClickable(): boolean {
        return (this.isLinkElement() || this.isButtonElement());
    }

    /**
     * 
     */
    protected isArray(): boolean {
        return Flagpole.toType(this.obj) == 'array';
    }

    /**
     * 
     */
    protected isString(): boolean {
        return Flagpole.toType(this.obj) == 'string';
    }

    /**
     * 
     */
    protected isObject(): boolean {
        return Flagpole.toType(this.obj) == 'object';
    }

    /**
     * 
     * @param key 
     */
    protected hasProperty(key: string): boolean {
        return this.obj.hasOwnProperty && this.obj.hasOwnProperty(key);
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
     * Get the raw object
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
    * Sometimes we need to get the actual string
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
     * Select another element.
     * 
     * @param path 
     * @param findIn 
     */
    public select(path: string, findIn?: any): Node {
        let node: Node = this.response.select(path, findIn);
        node.typeOfNode = NodeType.Value;
        node.selector = path;
        return node;
    }

    /**
     * 
     * @param key 
     */
    public headers(key?: string): Node {
        return this.response.headers(key);
    }

    /**
     * 
     */
    public status(): Node {
        return this.response.status();
    }

    /**
     * 
     */
    public loadTime(): Node {
        return this.response.loadTime();
    }

    /**
    * Gets back to the last element selected
    */
    public and(): Node {
        return this.response.and();
    }

    /**
     * Flip the next assertion
     */
    public not(): Node {
        this.response.not();
        return this;
    }

    /**
     * Write message for a comment
     *
     * @param {string} message
     */
    public comment(message: string): Node {
        this.response.scenario.comment(message);
        return this;
    }

    /**
     * Override the default message for this test so we can have a custom message that is more human readable
     *
     * @param {string} message
     */
    public label(message: string): Node {
        this.response.label(message);
        return this;
    }

    /**
     * For debugging, just spit out a value
     */
    public echo(): Node {
        this.comment(this.name + ' = ' + this.obj);
        return this;
    }

    /**
     * For debugging, just spit out this object's type
     */
    public typeof(): Node {
        this.comment('typeof ' + this.name + ' = ' + Flagpole.toType(this.obj));
        return this;
    }

    /**
     * SIMULATED ACTIONS
     */

    /**
     * Click on this link (kick off another scenario)
     *
     * @param {Scenario} nextScenario
     */
    public click(scenarioOrTitle: string | Scenario, impliedAssertion: boolean = false): Scenario {
        let scenario: Scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        // If this was a link, click it and then run the resulting scenaior
        if (this.isLinkElement()) {
            let link: Link = new Link(this.response, this.getAttribute('href') || '').validate();
            (link.isNavigation()) ?
                scenario.open(link.getUri()) :
                scenario.skip('Not a navigation link');
        }
        // If this was a button and it has a form to submit... submit that form
        else if (this.isButtonElement()) {
            let formNode: Node = new Node(this.response, 'form', this.obj.parents('form'));
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

    /**
     * Simulate form submission
     * 
     * @param nextScenario 
     */
    public submit(scenarioOrTitle: string | Scenario, impliedAssertion: boolean = false): Scenario {
        let scenario: Scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        let link: Link = new Link(this.response, this.getUrl() || '')
            .validate();
        if (this.isFormElement() && link.isNavigation()) {
            let uri: string;
            let method: string = this.getAttribute('method') || 'get';
            scenario.method(method);
            // Submit form values in query string
            if (method == 'get') {
                uri = link.getUri(this.obj.serializeArray());
            }
            // Submit form in multi-part form data
            else {
                let formDataArray: { name: string, value: string }[] = this.obj.serializeArray();
                let formData: any = {};
                uri = link.getUri();
                formDataArray.forEach(function (input: any) {
                    formData[input.name] = input.value;
                });
                scenario.form(formData)
            }
            scenario.open(uri);
        }
        else {
            scenario.skip('Nothing to submit');
        }
        return scenario;
    }

    public fillForm(formData: any): Node {
        if (this.isFormElement()) {
            this.comment('Filling out form');
            if (Flagpole.toType(formData) === 'object') {
                let form: Cheerio = this.obj;
                for (let name in formData) {
                    this.assert(
                        form.find('[name="' + name + '"]').val(formData[name]).val() == formData[name],
                        'Form field ' + name + ' equals ' + formData[name]
                    );
                }
            }
        }
        else {
            this.fail('Not a form');
        }
        return this;
    }

    protected getLambdaScenario(scenarioOrTitle: string | Scenario, impliedAssertion: boolean = false): Scenario {
        let node: Node = this;
        let scenario: Scenario = (function () {
            if (typeof scenarioOrTitle == 'string') {
                if (
                    node.isImageElement() ||
                    (node.typeOfNode == NodeType.StyleAttribute && node.selector == 'background-image')
                ) {
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
                // Nothing
            });
        }
        return scenario;
    }

    public load(scenarioOrTitle: string | Scenario, impliedAssertion: boolean = false): Scenario {
        let relativePath: string | null = this.getUrl();
        let link: Link = new Link(this.response, relativePath || '').validate();
        let scenario: Scenario = this.getLambdaScenario(scenarioOrTitle, impliedAssertion);
        if (relativePath === null) {
            scenario.skip('No URL to load');
        }
        else if (link.isNavigation()) {
            scenario.open(link.getUri())
        }
        else {
            scenario.skip('Nothing to load');
        }
        return scenario;
    }

    /**
     * DOM TRAVERSAL
     */

    public find(selector: string): Node {
        let node: Node = this.response.select(selector, this.obj);
        node.selector = selector;
        node.typeOfNode = NodeType.Element;
        return node;
    }

    public closest(selector: string): Node {
        let name: string = 'closest ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().closest(selector))
            );
        }
        else if (this.isObject()) {
            let arrPath: string[] = (this.response.getLastElementPath() || '').split('.');
            let found: boolean = false;
            // Loop through the path backwards
            let i = arrPath.length - 1;
            for (; i >= 0; i--) {
                if (arrPath[i] == selector) {
                    found = true;
                    break;
                }
            }
            // Found something that matched selector..  So build path up to that point
            if (found) {
                return this.select(arrPath.slice(0, i + 1).join('.'));
            }
        }
        return this.response.setLastElement('', new Node(this.response, name, null));
    }

    public parents(selector?: string): Node {
        let name: string = 'parent ' + selector;
        // If there is no selector then this is the same as the parent method
        if (typeof selector == 'undefined') {
            return this.parent();
        }
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().parents(selector))
            );
        }
        else if (this.isObject()) {
            let arrPath: string[] = (this.response.getLastElementPath() || '').split('.');
            if (arrPath.length > 1) {
                // Loop backwards, starting at the second to last element in path
                let found: boolean = false;
                let i = arrPath.length - 2;
                for (; i >= 0; i--) {
                    if (arrPath[i] == selector) {
                        found = true;
                        break;
                    }
                }
                // Found something that matched selector..  So build path up to that point
                if (found) {
                    return this.select(arrPath.slice(0, i + 1).join('.'));
                }
            }  
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    public parent(): Node {
        let name: string = 'parent';
        if (this.isDomElement()) {
            return this.response.setLastElement(null, new Node(this.response, name, this.get().parent()));
        }
        else if (this.isObject()) {
            let arrPath: string[] = (this.response.getLastElementPath() || '').split('.');
            // If the last selected path is at least 2 deep
            if (arrPath.length > 1) {
                return this.select(arrPath.slice(0, arrPath.length - 1).join('.'));
            }
            // Else return top level
            else {
                return this.response.setLastElement('', new Node(this.response, name, this.response.getRoot()));
            }
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    public siblings(selector): Node {
        let name: string = 'siblings ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().siblings(selector))
            );
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    public children(selector): Node {
        let name: string = 'children ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().children(selector))
            );
        }
        else if (this.isObject() || this.isArray()) {
            let obj: any = this.get();
            if (typeof selector !== 'undefined') {
                return this.select(selector, obj);
            }
            return this.response.setLastElement(null, new Node(this.response, name, obj));
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    public next(selector): Node {
        let name: string = 'next ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().next(selector))
            );
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    public prev(selector): Node {
        let name: string = 'next ' + selector;
        if (this.isDomElement()) {
            return this.response.setLastElement(
                null, new Node(this.response, name, this.get().prev(selector))
            );
        }
        else if (this.isObject()) {
            return this.parent().children(selector);
        }
        return this.response.setLastElement(null, new Node(this.response, name, null));
    }

    /**
     * Alias for nth because it's what jQuery uses even though it's a stupid name
     *
     * @param {number} i
     */
    public eq(i: number): Node {
        return this.nth(i);
    }

    /**
     * Select the nth value or an array or collection
     *
     * @param {number} i
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
     */
    public first(): Node {
        return this.nth(0);
    }

    /**
     * Get the last element in the array
     */
    public last(): Node {
        return this.nth(
            (this.obj && this.obj.length) ? (this.obj.length - 1) : -1
        );
    }

    public slice(start: number, end: number): Node {
        let name: string = this.name + ' slice(' + start + (end ? ' to ' + end : '') + ')';
        if (
            this.isDomElement() ||
            this.isArray() ||
            this.isString()
        ) {
            return new Node(this.response, name, this.get().slice(start, end));
        }
        return this;
    }

    /**
     * PROPERTIES AND ATTRIBUTES
     */
    
    public css(key: string): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.css(key);
        }
        let node: Node = new Node(this.response, this.name + '[style][' + key + ']', text);
        node.typeOfNode = NodeType.StyleAttribute;
        node.selector = key;
        return node;
    }
    
    /**
     * Get the attribute by name of this object
     *
     * @param {string} key
     */
    public attribute(key: string): Node {
        let text: any = null;
        if (this.isDomElement()) {
            text = this.obj.attr(key);
        }
        else if (!Flagpole.isNullOrUndefined(this.obj) && this.hasProperty(key)) {
            text = this.obj[key];
        }
        else if (this.response.getLastElement().isDomElement()) {
            text = this.response.getLastElement().get().attr(key);
        }
        this.typeOfNode = NodeType.Property;
        this.selector = key;
        return new Node(this.response, this.name + '[' + key + ']', text);
    }

    /**
     * Get the property by name of this object
     *
     * @param {string} key
     */
    public property(key: string): Node {
        let text: any;
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

    public prop(key: string): Node {
        return this.property(key);
    }

    /**
     * Get the data attribute by name of this object
     *
     * @param {string} key
     */
    public data(key: string): Node {
        let text: any = null;
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

    /**
     * Get the value of this object
     */
    public val(): Node {
        let text: any = null;
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

    /**
    * Get the text of this object
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
     */
    public length(): Node {
        let count: number = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Node(this.response, 'Length of ' + this.name, count);
    }

    public type(): Node {
        return new Node(this.response, 'Type of ' + this.name, Flagpole.toType(this.obj));
    }

    /**
     * Get the float/double value of this object
     */
    public parseFloat(): Node {
        return new Node(this.response, 'Float of ' + this.name, parseFloat(this.toString()));
    }

    /**
     * Get the integer value of this object
     */
    public parseInt(): Node {
        return new Node(this.response, 'Integer of ' + this.name, parseInt(this.toString()));
    }

    /**
     * Trim extra whitespace around the string value
     */
    public trim(): Node {
        let text: string = this.toString().trim();
        return new Node(this.response, 'Trimmed text of ' + this.name, text);
    }

    /**
     * Lowercase the string value
     */
    public toLowerCase(): Node {
        let text: string = this.toString().toLowerCase();
        return new Node(this.response, 'Lowercased text of ' + this.name, text);
    }

    /**
     * Uppercase the string value
     */
    public toUpperCase(): Node {
        let text: string = this.toString().toUpperCase();
        return new Node(this.response, 'Uppercased text of ' + this.name, text);
    }

    /**
     * Decodes an encoded string.
     */
    public decodeURI(): Node {
        let text: string = decodeURI(this.toString());
        return new Node(this.response, 'Unescaped text of ' + this.name, text);
    }

    public decodeURIComponent(): Node {
        let text: string = decodeURIComponent(this.toString());
        return new Node(this.response, 'Unescaped text of ' + this.name, text);
    }

    /**
     * Encodes a string. 
     * This function makes a string portable, so it can be transmitted across any network to any computer that supports ASCII characters.
     * This function encodes special characters, with the exception of: * @ - _ + . /
     */
    public encodeURI(): Node {
        let text: string = encodeURI(this.toString());
        return new Node(this.response, 'Escaped text of ' + this.name, text);
    }

    public encodeURIComponent(): Node {
        let text: string = encodeURIComponent(this.toString());
        return new Node(this.response, 'Escaped text of ' + this.name, text);
    }

    /**
     * Replace the string value
     *
     * @param {string | RegExp} search
     * @param {string} replace
     */
    public replace(search: string | RegExp, replace: string): Node {
        let text: string = this.toString().replace(search, replace);
        return new Node(this.response, 'Replaced text of ' + this.name, text);
    }

    /**
     * LOOPS
     */

    /**
     * Loop through it
     *
     * @param {Function} callback
     */
    public each(callback: Function): Node {
        let name: string = this.name;
        let response: iResponse = this.response;
        if (this.isDomElement()) {
            this.obj.each(function (index, el) {
                el = $(el);
                callback(
                    new Node(response, name + '[' + index + ']', el), 
                    index
                );
            });
        }
        else if (this.isArray()) {
            this.obj.forEach(function (el, index) {
                callback(
                    new Node(response, name + '[' + index + ']', el),
                    index
                );
            });
        }
        else if (Flagpole.toType(this.obj) == 'object') {
            let obj: {} = this.obj;
            this.obj.keys().forEach(function (key) {
                callback(
                    new Node(response, name + '[' + key + ']', obj[key]),
                    key
                );
            });
        }
        else if (Flagpole.toType(this.obj) == 'string') {
            this.obj.toString().trim().split(' ').forEach(function (word, index) {
                callback(
                    new Node(response, name + '[' + index + ']', word),
                    index
                );
            });
        }
        return this;
    }

    /**
     * Loops through the element and expects the return from every callback to be true
     *
     * @param {Function} callback
     */
    public every(callback: Function): Node {
        let name: string = this.name;
        let response: iResponse = this.response;
        let every: boolean = true;
        let node: Node = this;
        this.response.ignore(function () {
            if (node.isDomElement()) {
                node.obj.each(function (index, el) {
                    el = $(el);
                    let element: Node = new Node(response, name + '[' + index + ']', el);
                    if (!callback(element)) {
                        every = false;
                    }
                });
            }
            else if (node.isArray()) {
                every = node.obj.every(function (el, index) {
                    return callback(
                        new Node(response, name + '[' + index + ']', el)
                    );
                });
            }
            else if (node.isObject()) {
                let obj: {} = node.obj;
                every = node.obj.keys().every(function (key) {
                    return callback(
                        new Node(response, name + '[' + key + ']', obj[key])
                    );
                });
            }
            else if (node.isString()) {
                every = node.obj.toString().trim().split(' ').every(function (word, index) {
                    return callback(
                        new Node(response, name + '[' + index + ']', word)
                    );
                });
            }
        });
        this.assert(every,
            'Every ' + this.name + ' passed'
        );
        return this;
    }

    /**
     * Loops through the element and expects the return from every callback to be true
     *
     * @param {Function} callback
     */
    public some(callback: Function): Node {
        let name: string = this.name;
        let response: iResponse = this.response;
        let some: boolean = false;
        let node: Node = this;
        this.response.ignore(function () {
            if (node.isDomElement()) {
                node.obj.each(function (index, el) {
                    el = $(el);
                    let element: Node = new Node(response, name + '[' + index + ']', el);
                    if (callback(element)) {
                        some = true;
                    }
                });
            }
            else if (node.isArray()) {
                some = node.obj.some(function (el, index) {
                    return callback(
                        new Node(response, name + '[' + index + ']', el)
                    );
                });
            }
            else if (node.isObject()) {
                let obj: {} = node.obj;
                some = node.obj.keys().some(function (key) {
                    return callback(
                        new Node(response, name + '[' + key + ']', obj[key])
                    );
                });
            }
            else if (node.isString()) {
                some = node.obj.toString().trim().split(' ').some(function (word, index) {
                    return callback(
                        new Node(response, name + '[' + index + ']', word)
                    );
                });
            }
        });
        this.assert(some,
            'Some ' + this.name + ' passed'
        );
        return this;
    }

    /**
     * Alias for some
     * 
     * @param callback 
     */
    public any(callback: Function): Node {
        return this.some(callback);
    }

    /**
     * ASSERTIONS 
     */

    /**
     * Does this element have this class name?
     *
     * @param {string} className
     */
    public hasClass(className: string): Node {
        if (this.isDomElement()) {
            this.assert(this.obj.hasClass(className),
                this.name + ' has class ' + className
            );
        }
        return this;
    }
    
    /**
    * Is this object's value greater than this?
    *
    * @param {number} value
    */
    public greaterThan(value: number): Node {
        return this.assert(this.obj > value,
            this.name + ' is greater than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     *  Is this object's value greater than or equal to this?
     *
     * @param value
     */
    public greaterThanOrEquals(value: any): Node {
        return this.assert(this.obj >= value,
            this.name + ' is greater than or equal to ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     * Is this object's value less than this?
     *
     * @param {number} value
     */
    public lessThan(value: number): Node {
        return this.assert(this.obj < value,
            this.name + ' is less than ' + value + ' (' + this.obj + ')'
        );
    }

    /**
     * Is this object's value less or equal to this?
     *
     * @param value
     */
    public lessThanOrEquals(value: any): Node {
        return this.assert(this.obj <= value,
            this.name + ' is less than or equal to ' + value + ' (' + this.obj + ')'
        );
    }

    public between(minValue: any, maxValue: any): Node {
        return this.assert(this.obj >= minValue && this.obj <= maxValue,
            this.name + ' is between ' + minValue + ' and ' + maxValue + ' (' + this.obj + ')'
        );
    }

    /**
     * Make an assertion
     * 
     * @param statement 
     * @param passMessage 
     * @param failMessage 
     */
    public assert(statement: boolean, message: string, actualValue?: string): Node {
        this.response.assert(statement, message, actualValue);
        return this;
    }

    /**
     * Does this object contain this? Works for strings, arrays, and objects alike
     *
     * @param {string} string
     */
    public contains(string: string): Node {
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
            this.name + ' contains "' + string + '"'
        );
    }

    /**
     * Alias for contains
     * 
     * @param string 
     */
    public contain(string: string): Node {
        return this.contains(string);
    }

    /**
     * Test with regular expression
     *
     * @param {RegExp} pattern
     */
    public matches(pattern: RegExp): Node {
        let value: string = this.toString();
        return this.assert(pattern.test(value),
            this.name + ' matches ' + String(pattern),
            value
        );
    }

    /**
     * Does it start with this value?
     *
     * @param {string} matchText
     */
    public startsWith(matchText: string): Node {
        let assert: boolean = false;
        let value: string = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === 0);
        }
        return this.assert(assert,
            this.name + ' starts with "' + matchText + '"', 
            matchText
        );
    }

    /**
     * Does this end with this value?
     *
     * @param {string} matchText
     */
    public endsWith(matchText: string): Node {
        let assert: boolean = false;
        let value: string = '';
        if (!this.isNullOrUndefined()) {
            value = this.toString();
            assert = (value.indexOf(matchText) === value.length - matchText.length);
        }
        return this.assert(assert,
            this.name + ' ends with "' + matchText + '"',
            matchText
        );
    }

    /**
     * Does this objects type match this?
     *
     * @param {string} type
     */
    public is(type: string): Node {
        let myType: string = Flagpole.toType(this.obj);
        return this.assert((myType == type.toLocaleLowerCase()),
            this.name + ' is type ' + type, 
            myType
        );
    }

    /**
     * Does this element exist?
     */
    public exists(): Node {
        let exists: boolean = false;
        if (this.isDomElement()) {
            exists = (this.obj.length > 0);
        }
        else if (!this.isNullOrUndefined()) {
            exists = true;
        }
        return this.assert(exists,
            this.name + ' exists'
        );
    }

    /**
     *  Is this object's value equal to this?
     *
     * @param value
     * @param {boolean} permissiveMatching
     */
    public equals(value: any, permissiveMatching: boolean = false): Node {
        let matchValue: string = this.toString();
        let equals: string = 'equals';
        let messageValue: string = (typeof value == 'string') ? '"' + value + '"' : value;
        if (permissiveMatching) {
            value = value.toLowerCase().trim();
            matchValue = matchValue.toLowerCase().trim();
            equals = 'is similar to';
        }
        return this.assert(matchValue == value,
            this.name + ' ' + equals + ' ' + messageValue, 
            matchValue
        );
    }

    /**
     * Is this object's value similar to this?
     *
     * @param value
     */
    public similarTo(value: any): Node {
        return this.equals(value, true);
    }

    /**
     * See if this string is in the list of enum values
     */
    public in(arrayOfValues: string[]): Node {
        let value: string = this.toString();
        return this.assert(
            arrayOfValues.indexOf(value) >= 0,
            this.name + ' is in list: ' + arrayOfValues.join(','),
            value
        );
    }

}