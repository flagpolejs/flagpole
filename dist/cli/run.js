"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
function run(suite = []) {
    let tests = new cli_helper_1.Tests(cli_helper_1.Cli.testsPath || process.cwd());
    if (suite.length) {
        let notExists = tests.getAnyTestSuitesNotFound(suite);
        if (notExists !== null) {
            cli_helper_1.Cli.log('Test suite not found: ' + notExists);
            cli_helper_1.Cli.exit(1);
        }
    }
    tests.filterTestSuitesByName(suite);
    if (!tests.foundTestSuites()) {
        cli_helper_1.Cli.log("Did not find any tests to run.\n");
        cli_helper_1.Cli.exit(2);
    }
    tests.runAll();
}
exports.run = run;
