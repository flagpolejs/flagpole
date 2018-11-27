"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const node_1 = require("./node");
;
class ImageResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.imageProperties = JSON.parse(response.body);
        this.label('MIME Type matches expected value for an image')
            .select('mime').startsWith('image/');
    }
    select(propertyName) {
        let image = this;
        let value = typeof this.imageProperties[propertyName] !== 'undefined' ?
            this.imageProperties[propertyName] : null;
        return new node_1.Node(this, propertyName, value);
    }
    getType() {
        return response_1.ResponseType.image;
    }
    length() {
        return new node_1.Node(this, 'Size of image', this.imageProperties.length);
    }
    url() {
        return new node_1.Node(this, 'URL of image', this.imageProperties.url);
    }
    path() {
        return new node_1.Node(this, 'Path', new URL(this.imageProperties.url).pathname);
    }
}
exports.ImageResponse = ImageResponse;
