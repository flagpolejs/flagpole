"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
class ImageResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.status().between(200, 299);
        this.headers('Content-Type')
            .label('MIME Type matches expected value for an image')
            .startsWith('image/');
    }
    getType() {
        return response_1.ResponseType.image;
    }
}
exports.ImageResponse = ImageResponse;
