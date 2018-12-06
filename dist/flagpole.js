"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const suite_1 = require("./suite");
const cheerio = require('cheerio');
var FlagpoleOutput;
(function (FlagpoleOutput) {
    FlagpoleOutput[FlagpoleOutput["console"] = 1] = "console";
    FlagpoleOutput[FlagpoleOutput["text"] = 2] = "text";
    FlagpoleOutput[FlagpoleOutput["json"] = 3] = "json";
    FlagpoleOutput[FlagpoleOutput["html"] = 4] = "html";
    FlagpoleOutput[FlagpoleOutput["csv"] = 5] = "csv";
    FlagpoleOutput[FlagpoleOutput["tsv"] = 6] = "tsv";
    FlagpoleOutput[FlagpoleOutput["psv"] = 7] = "psv";
})(FlagpoleOutput = exports.FlagpoleOutput || (exports.FlagpoleOutput = {}));
class Flagpole {
    static setEnvironment(env) {
        Flagpole.environment = env;
    }
    static getEnvironment() {
        return Flagpole.environment;
    }
    static setOutput(output) {
        if (typeof output == 'string') {
            if (Object.keys(FlagpoleOutput).includes(output)) {
                if (parseInt(output) > 0) {
                    Flagpole.output = parseInt(output);
                }
                else {
                    Flagpole.output = FlagpoleOutput[output];
                }
            }
        }
    }
    static getOutput() {
        return Flagpole.output;
    }
    static Suite(title) {
        let suite = new suite_1.Suite(title);
        return suite;
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
Flagpole.automaticallyPrintToConsole = false;
Flagpole.quietMode = false;
Flagpole.logOutput = false;
Flagpole.environment = 'dev';
Flagpole.output = FlagpoleOutput.console;
exports.Flagpole = Flagpole;
