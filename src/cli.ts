#!/usr/bin/env node
'use strict';
import { Cli, Tests, TestSuiteFile } from "./cli-helper";

let fs = require('fs');

/**
 * COMMAND LINE ARGUMENTS
 */
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
    .default('e', function() {
        return 'dev';
    }, 'dev')
    .default('s', function() {
        return [];
    })
    .default('g', function() {
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
        Cli.log(yargs.help());
        Cli.log(msg);
        Cli.exit(1);
    })
    .argv;

// Enforce limited list of commands
process.env.FLAGPOLE_COMMAND = argv._[0];
if (['run', 'list'].indexOf(String(process.env.FLAGPOLE_COMMAND)) < 0) {
    Cli.log("Command must be either: run, list\n");
    Cli.log("Example: flagpole run\n");
    Cli.exit(1);
}


/**
 * Get environment
 */
process.env.FLAGPOLE_ENV = argv.e;

/**
 * Set initial base path
 */
process.env.FLAGPOLE_PATH = Cli.normalizePath(typeof argv.p !== 'undefined' ? argv.p : process.cwd());
if (argv.p) {
    if (fs.existsSync(process.env.FLAGPOLE_PATH)) {
        // Query the entry
        let stats = fs.lstatSync(process.env.FLAGPOLE_PATH);
        // Is it a directory?
        if (!stats.isDirectory()) {
            Cli.log("The path you specified is not a directory.");
            Cli.exit(1);
        }
    }
    else {
        Cli.log("The path you specified did not exist.");
        Cli.exit(1);
    }
}

/**
 * Read the config file in the path
 */
process.env.FLAGPOLE_CONFIG_PATH = (argv.c || process.env.FLAGPOLE_PATH + 'flagpole.json');
let config: any = {};
// If we found a config file at this path
if (fs.existsSync(process.env.FLAGPOLE_CONFIG_PATH)) {
    let contents = fs.readFileSync(process.env.FLAGPOLE_CONFIG_PATH);
    let configDir: string = Cli.normalizePath(require('path').dirname(process.env.FLAGPOLE_CONFIG_PATH));
    config = JSON.parse(contents);
    if (config.hasOwnProperty('path')) {
        // If path is absolute
        if (/^\//.test(config.path)) {
            process.env.FLAGPOLE_PATH = Cli.normalizePath(config.path);
        }
        // If path just says current directory
        else if (config.path == '.') {
            process.env.FLAGPOLE_PATH = Cli.normalizePath(configDir);
        }
        // Path is relative
        else {
            process.env.FLAGPOLE_PATH = Cli.normalizePath(configDir + config.path);
        }
    }
}
// If they specified a command line config that doesn't exist
else if (argv.c) {
    Cli.log("The config file you specified did not exist.\n");
    Cli.exit(1);
}

/**
 * Determine the root tests folder
 */
process.env.FLAGPOLE_TESTS_FOLDER = (function() {
    // Get command line args
    let path: string = Cli.normalizePath(process.env.FLAGPOLE_PATH || process.cwd());
    let group: string = (typeof argv.g !== 'undefined') ? argv.g : '';
    // Make sure path has trailing slashes
    path = Cli.normalizePath(path);
    // Now build our output
    return path + group;
})();

/**
 * LIST TEST SUITES
 */
if (process.env.FLAGPOLE_COMMAND == 'list') {
    let tests: Tests = new Tests(process.env.FLAGPOLE_TESTS_FOLDER || process.cwd());

    Cli.log('Looking in folder: ' + tests.getTestsFolder() + "\n");
    if (tests.foundTestSuites()) {
        Cli.log('Found these test suites:');
        Cli.list(tests.getSuiteNames());
        Cli.log("\n");
        Cli.exit(0);
    }
    else {
        Cli.log("Did not find any tests.\n");
        Cli.exit(2);
    }
}
/**
 * RUN TEST SUITES
 */
else if (process.env.FLAGPOLE_COMMAND == 'run') {
    let tests: Tests = new Tests(process.env.FLAGPOLE_TESTS_FOLDER || process.cwd());

    // Run a specific test suites
    if (argv.suite) {
        // Do all of these test suites requested actually exist?
        let notExists: string|null = tests.getAnyTestSuitesNotFound(argv.suite)
        if (notExists !== null) {
            Cli.log('Test suite not found: ' + notExists);
            Cli.exit(1);
        }
    }

    // Apply filters
    tests.filterTestSuitesByName(argv.suite);

    // If no matching tests found to run
    if (!tests.foundTestSuites()) {
        Cli.log("Did not find any tests to run.\n");
        Cli.exit(2);
    }

    // Run them doggies
    tests.runAll();

}

