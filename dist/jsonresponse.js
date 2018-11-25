"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const node_1 = require("./node");
class JsonResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        this.valid();
    }
    valid() {
        return this.assert((typeof this.json === 'object' && this.json !== null), 'JSON is valid', 'JSON is not valid');
    }
    getRoot() {
        return this.json;
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
            element = new node_1.Node(response, path, obj);
        }
        else {
            element = new node_1.Node(response, path, undefined);
        }
        this.setLastElement(path, element);
        element.exists();
        return element;
    }
}
exports.JsonResponse = JsonResponse;
