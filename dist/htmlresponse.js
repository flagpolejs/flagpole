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
    getRoot() {
        return $;
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
}
exports.HtmlResponse = HtmlResponse;
