"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const genericrequest_1 = require("./genericrequest");
const property_1 = require("./property");
let cheerio = require('cheerio');
class HtmlRequest extends genericrequest_1.GenericRequest {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.$ = cheerio.load(response.body);
    }
    select(path, findIn) {
        let obj = null;
        if (index_1.Flagpole.toType(findIn) == 'cheerio') {
            obj = findIn.find(path);
        }
        else {
            obj = this.$(path);
        }
        let element = new property_1.Element(this, path, obj);
        this.lastElement(element);
        element.exists();
        return element;
    }
}
exports.HtmlRequest = HtmlRequest;
