"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consoleline_1 = require("./consoleline");
const suite_1 = require("./suite");
const cli_helper_1 = require("./cli/cli-helper");
let cheerio = require('cheerio');
let lastArg = null;
let env = null;
process.argv.forEach(function (arg) {
    if (lastArg == '-e') {
        env = arg;
        cli_helper_1.Cli.environment = env;
    }
    lastArg = arg;
});
class Flagpole {
    static Suite(title) {
        let suite = new suite_1.Suite(title);
        return suite;
    }
    static heading(message) {
        let length = Math.max(message.length + 10, 50), padding = (length - message.length) / 2;
        new consoleline_1.ConsoleLine('='.repeat(length), "\x1b[33m").write();
        new consoleline_1.ConsoleLine(' '.repeat(padding) + message.toLocaleUpperCase() + ' '.repeat(padding), "\x1b[33m").write();
        new consoleline_1.ConsoleLine('='.repeat(length), "\x1b[33m").write();
    }
    static message(message, color) {
        new consoleline_1.ConsoleLine(message, color).write();
    }
    static toSimplifiedResponse(response, body) {
        return {
            statusCode: response.statusCode,
            body: body,
            headers: response.headers,
        };
    }
    static isNullOrUndefined(obj) {
        return (typeof obj === "undefined" || obj === null);
    }
    static toType(obj) {
        if (typeof obj === "undefined") {
            return 'undefined';
        }
        else if (obj === null) {
            return 'null';
        }
        else if (obj instanceof cheerio) {
            return 'cheerio';
        }
        else if (obj && obj.constructor && obj.constructor.name) {
            return obj.constructor.name.toLocaleLowerCase();
        }
        else if (obj && obj.constructor && obj.constructor.toString) {
            let arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return arr[1].toLocaleLowerCase();
            }
        }
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLocaleLowerCase();
    }
}
exports.Flagpole = Flagpole;
