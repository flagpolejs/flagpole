"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const css = require('css');
class CssResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.headers('Content-Type').similarTo('text/css');
        this.css = css.parse(this.getBody(), { silent: true });
        this.validate();
    }
    getType() {
        return response_1.ResponseType.stylesheet;
    }
    validate() {
        this.assert((this.css.type == 'stylesheet' &&
            this.css.stylesheet &&
            this.css.stylesheet.parsingErrors &&
            this.css.stylesheet.parsingErrors.length === 0), 'CSS is valid', 'CSS is not valid');
    }
}
exports.CssResponse = CssResponse;
