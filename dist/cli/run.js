"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
function run(selectedSuites = []) {
    let tests = new cli_helper_1.TestRunner();
    let suites = cli_helper_1.Cli.config.getSuites();
    if (selectedSuites.length) {
        suites.forEach(function (suite) {
            if (selectedSuites.includes(suite.name)) {
                tests.addSuite(suite);
            }
        });
    }
    else {
        suites.forEach(function (suite) {
            tests.addSuite(suite);
        });
    }
    if (tests.getSuites().length == 0) {
        cli_helper_1.Cli.log("Did not find any test suites to run.\n");
        cli_helper_1.Cli.exit(2);
    }
    tests.run();
}
exports.run = run;
