"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const node_1 = require("./node");
const response_1 = require("./response");
let cheerio = require('cheerio');
let $;
class HtmlResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        $ = cheerio.load(response.body);
    }
    select(path, findIn) {
        let obj = null;
        if (index_1.Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(path);
        }
        else {
            obj = $(path);
        }
        let element = new node_1.Node(this, path, obj);
        this.setLastElement(path, element);
        element.exists();
        return element;
    }
    parents(selector) {
        let obj = null;
        let name = 'parent ' + selector;
        let last = this.getLastElement();
        if (last.isDomElement()) {
            obj = last.get().parents(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    parent() {
        let obj = null;
        let name = 'parent';
        let last = this.getLastElement();
        if (last.isDomElement()) {
            obj = last.get().parent();
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    closest(selector) {
        let obj = null;
        let name = 'closest ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().closest(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    children(selector) {
        let obj = null;
        let name = 'children ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().children(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    siblings(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().siblings(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    next(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().next(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    prev(selector) {
        let obj = null;
        let name = 'next ' + selector;
        if (this.getLastElement().isDomElement()) {
            obj = this.getLastElement().get().prev(selector);
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
}
exports.HtmlResponse = HtmlResponse;
