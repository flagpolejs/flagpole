"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Mock {
    constructor(url, body) {
        this.statusCode = 200;
        this.body = '';
        this.headers = [];
        this.url = url;
        this.body = body;
    }
    static loadLocalFile(relativePath) {
        let fs = require('fs');
        let path = __dirname + '/' + relativePath;
        return new Promise((resolve, reject) => {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(new Mock(path, data.toString()));
            });
        });
    }
}
exports.Mock = Mock;
