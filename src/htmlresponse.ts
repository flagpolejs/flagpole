import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { iResponse, SimplifiedResponse, GenericResponse } from "./response";

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends GenericResponse implements iResponse {

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        $ = cheerio.load(response.body);
    }

    /**
     * Select the html element at this CSS Selector or XPath
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        let obj: any = null;
        // If findIn is a cheerio object, then look in it
        if (Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(path);
        }
        // Otheriwse use top level context
        else {
            obj = $(path);
        }
        // Create the property
        let element: Node = new Node(this, path, obj);
        this.setLastElement(path, element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

    /**
     * Find a matching parent element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public parents(selector?: string): Node {
        let obj: any = null;
        let name: string = 'parent ' + selector;
        let last: Node = this.getLastElement();
        if (last.isDomElement()) {
            obj = last.get().parents(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * 
     */
    public parent(): Node {
        let obj: any = null;
        let name: string = 'parent';
        let last: Node = this.getLastElement();
        if (last.isDomElement()) {
            obj = last.get().parent();
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
    * Going up the object model, find the closest matching element, relative to the currently selected element
    *
    * @param {string} selector
    * @returns {Node}
    */
    public closest(selector: string): Node {
        let obj: any = null;
        let name: string = 'closest ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().closest(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * Find matching child elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public children(selector?: string): Node {
        let obj: any = null;
        let name: string = 'children ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().children(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * Find matching sibling elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public siblings(selector?: string): Node {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().siblings(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * Find the next element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public next(selector?: string): Node {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().next(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * Find the previous element matching, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public prev(selector?: string): Node {
        let obj: any = null;
        let name: string = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().prev(selector);
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

}
