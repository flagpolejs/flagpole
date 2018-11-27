"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const node_1 = require("./node");
class ResourceResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.status().between(200, 299);
    }
    select(path) {
        return new node_1.Node(this, path, null);
    }
    getType() {
        return response_1.ResponseType.resource;
    }
}
exports.ResourceResponse = ResourceResponse;
