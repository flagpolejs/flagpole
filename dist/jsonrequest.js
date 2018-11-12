"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genericrequest_1 = require("./genericrequest");
const element_1 = require("./element");
class JsonRequest extends genericrequest_1.GenericRequest {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }
    select(path, findIn) {
        let args = path.split('.');
        let obj = findIn || this.json;
        let response = this;
        let element;
        if (args.every(function (value) {
            obj = obj[value];
            return (typeof obj !== 'undefined');
        })) {
            element = new element_1.Element(response, path, obj);
        }
        else {
            element = new element_1.Element(response, path, undefined);
        }
        this.lastElement(element);
        element.exists();
        return element;
    }
}
exports.JsonRequest = JsonRequest;
