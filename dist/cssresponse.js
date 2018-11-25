"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
class CssResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.validate();
    }
    validate() {
        let cssRegEx = /([#.@]?[\w.:> ]+)[\s]{[\r\n]?([A-Za-z\- \r\n\t]+[:][\s]*[\w .\/()\-!]+;[\r\n]*(?:[A-Za-z\- \r\n\t]+[:][\s]*[\w .\/()\-!]+;[\r\n]*(?2)*)*)}/;
        this.assert(cssRegEx.test(this.response.body), 'Is valid CSS', 'Is not valid CSS');
    }
}
exports.CssResponse = CssResponse;
