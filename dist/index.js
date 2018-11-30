"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flagpole_1 = require("./flagpole");
exports.Flagpole = flagpole_1.Flagpole;
let lastArg = null;
let env = null;
process.argv.forEach(function (arg) {
    if (lastArg == '-e') {
        env = arg;
        flagpole_1.Flagpole.environment = env;
    }
    lastArg = arg;
});
