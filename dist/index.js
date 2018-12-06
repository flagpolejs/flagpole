"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flagpole_1 = require("./flagpole");
exports.Flagpole = flagpole_1.Flagpole;
let lastArg = null;
let env = null;
process.argv.forEach(function (arg) {
    if (lastArg == '-e') {
        env = arg;
        flagpole_1.Flagpole.setEnvironment(env);
    }
    else if (lastArg == '-o') {
        flagpole_1.Flagpole.setOutput(arg);
        flagpole_1.Flagpole.automaticallyPrintToConsole = true;
    }
    else if (arg == '-q') {
        flagpole_1.Flagpole.quietMode = true;
        lastArg = null;
        return;
    }
    else if (arg == '-l') {
        flagpole_1.Flagpole.logOutput = true;
        lastArg = null;
        return;
    }
    lastArg = arg;
});
