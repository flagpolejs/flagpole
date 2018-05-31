#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
let fs = require('fs');
let yargs = require('yargs');
let argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .help(false)
    .version(false)
    .demandCommand(1, 'You must specify a command: list, run')
    .alias({
    's': 'suite',
    'g': 'group',
    'p': 'path',
    'e': 'env',
    'c': 'config'
})
    .describe({
    'g': 'Filter only a group of test suites in this subfolder',
    's': 'Specify one or more suites to run',
    'p': 'Specify the folder to look for tests within',
    'e': 'Environment like: dev, staging, prod',
    'c': 'Path to config file'
})
    .array('s')
    .string('g')
    .string('p')
    .string('e')
    .default('e', function () {
    return 'dev';
}, 'dev')
    .default('s', function () {
    return [];
})
    .default('g', function () {
    return '';
})
    .example('flagpole list', 'To show a list of test suites')
    .example('flagpole run', 'To run all test suites')
    .example('flagpole run -s smoke', 'To run just the suite called smoke')
    .example('flagpole run -s smoke api', 'Or you can run multiple suites (smoke and api)')
    .example('flagpole run -g basic', 'To run all test suites in the basic group')
    .epilogue('For more information, go to https://github.com/flocasts/flagpole')
    .wrap(Math.min(100, yargs.terminalWidth()))
    .fail(function (msg, err, yargs) {
    cli_helper_1.Cli.log(yargs.help());
    cli_helper_1.Cli.log(msg);
    cli_helper_1.Cli.exit(1);
})
    .argv;
process.env.FLAGPOLE_COMMAND = argv._[0];
if (['run', 'list'].indexOf(String(process.env.FLAGPOLE_COMMAND)) < 0) {
    cli_helper_1.Cli.log("Command must be either: run, list\n");
    cli_helper_1.Cli.log("Example: flagpole run\n");
    cli_helper_1.Cli.exit(1);
}
process.env.FLAGPOLE_ENV = argv.e;
process.env.FLAGPOLE_PATH = cli_helper_1.Cli.normalizePath(typeof argv.p !== 'undefined' ? argv.p : process.cwd());
if (argv.p) {
    if (fs.existsSync(process.env.FLAGPOLE_PATH)) {
        let stats = fs.lstatSync(process.env.FLAGPOLE_PATH);
        if (!stats.isDirectory()) {
            cli_helper_1.Cli.log("The path you specified is not a directory.");
            cli_helper_1.Cli.exit(1);
        }
    }
    else {
        cli_helper_1.Cli.log("The path you specified did not exist.");
        cli_helper_1.Cli.exit(1);
    }
}
process.env.FLAGPOLE_CONFIG_PATH = (argv.c || process.env.FLAGPOLE_PATH + 'flagpole.json');
let config = {};
if (fs.existsSync(process.env.FLAGPOLE_CONFIG_PATH)) {
    let contents = fs.readFileSync(process.env.FLAGPOLE_CONFIG_PATH);
    let configDir = cli_helper_1.Cli.normalizePath(require('path').dirname(process.env.FLAGPOLE_CONFIG_PATH));
    config = JSON.parse(contents);
    if (config.hasOwnProperty('path')) {
        if (/^\//.test(config.path)) {
            process.env.FLAGPOLE_PATH = cli_helper_1.Cli.normalizePath(config.path);
        }
        else if (config.path == '.') {
            process.env.FLAGPOLE_PATH = cli_helper_1.Cli.normalizePath(configDir);
        }
        else {
            process.env.FLAGPOLE_PATH = cli_helper_1.Cli.normalizePath(configDir + config.path);
        }
    }
    if (config.hasOwnProperty('base')) {
        if (config.base.hasOwnProperty(process.env.FLAGPOLE_ENV)) {
            process.env.FLAGPOLE_BASE_DOMAIN = config.base[String(process.env.FLAGPOLE_ENV)];
        }
    }
}
else if (argv.c) {
    cli_helper_1.Cli.log("The config file you specified did not exist.\n");
    cli_helper_1.Cli.exit(1);
}
process.env.FLAGPOLE_TESTS_FOLDER = (function () {
    let path = cli_helper_1.Cli.normalizePath(process.env.FLAGPOLE_PATH || process.cwd());
    let group = (typeof argv.g !== 'undefined') ? argv.g : '';
    path = cli_helper_1.Cli.normalizePath(path);
    return path + group;
})();
if (process.env.FLAGPOLE_COMMAND == 'list') {
    let tests = new cli_helper_1.Tests(process.env.FLAGPOLE_TESTS_FOLDER || process.cwd());
    cli_helper_1.Cli.log('Looking in folder: ' + tests.getTestsFolder() + "\n");
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
else if (process.env.FLAGPOLE_COMMAND == 'run') {
    let tests = new cli_helper_1.Tests(process.env.FLAGPOLE_TESTS_FOLDER || process.cwd());
    if (argv.suite) {
        let notExists = tests.getAnyTestSuitesNotFound(argv.suite);
        if (notExists !== null) {
            cli_helper_1.Cli.log('Test suite not found: ' + notExists);
            cli_helper_1.Cli.exit(1);
        }
    }
    tests.filterTestSuitesByName(argv.suite);
    if (!tests.foundTestSuites()) {
        cli_helper_1.Cli.log("Did not find any tests to run.\n");
        cli_helper_1.Cli.exit(2);
    }
    tests.runAll();
}
