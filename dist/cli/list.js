"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
function list(suite = []) {
    let tests = new cli_helper_1.Tests(cli_helper_1.Cli.testsPath || process.cwd());
    cli_helper_1.Cli.log('Looking in folder: ' + tests.getTestsFolder());
    cli_helper_1.Cli.log('');
    if (tests.foundTestSuites()) {
        cli_helper_1.Cli.log('Found these test suites:');
        cli_helper_1.Cli.list(tests.getSuiteNames());
        cli_helper_1.Cli.log("\n");
        cli_helper_1.Cli.exit(0);
    }
    else {
        cli_helper_1.Cli.log("Did not find any tests.\n");
        cli_helper_1.Cli.exit(2);
    }
}
exports.list = list;
