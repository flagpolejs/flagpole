#!/usr/bin/env node
'use strict';
import { Cli, Tests, FlagpoleConfig } from "./cli-helper";

const fs = require('fs');

/**
 * COMMAND LINE ARGUMENTS
 */
let commands = ['run', 'list', 'init', 'add', 'login', 'logout', 'deploy', 'pack'];
let yargs = require('yargs');
let argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .help(false)
    .alias('v', 'version')
    .version()
    .demandCommand(1, 'You must specify a command: ' + commands.join(", "))
    .alias({
        's': 'suite',
        'g': 'group',
        'p': 'path',
        'e': 'env',
        'c': 'config',
        'd': 'debug',
        'h': 'hide_banner'
    })
    .describe({
        'g': 'Filter only a group of test suites in this subfolder',
        's': 'Specify one or more suites to run',
        'p': 'Specify the folder to look for tests within',
        'e': 'Environment like: dev, staging, prod',
        'c': 'Path to config file',
        'd': 'Show extra debug info',
        'h': 'Hide the output banner'
    })
    .array('s')
    .string('g')
    .string('p')
    .string('e')
    .boolean('d')
    .boolean('h')
    .default('e', 'dev')
    .default('s', [])
    .default('g', '')
    .default('h', false)
    .example('flagpole list', 'To show a list of test suites')
    .example('flagpole run', 'To run all test suites')
    .example('flagpole run -s smoke', 'To run just the suite called smoke')
    .example('flagpole run -s smoke api', 'Or you can run multiple suites (smoke and api)')
    .example('flagpole run -g basic', 'To run all test suites in the basic group')
    .example('flagpole init', 'Initialize a new Flagpole project')
    .example('flagpole add suite', 'Add a new test suite')
    .example('flagpole add scenario', 'Add a new scenario to a test suite')
    .example('flagpole login', 'Login to your FlagpoleJS.com account')
    .example('flagpole logout', 'Logout of your FlagpoleJS.com account')
    .example('flagpole deploy', 'Send your test project to your FlagpoleJS.com account')
    .example('flagpole pack', 'Pack this Flagpole project into a zip achive')
    .epilogue('For more information, go to https://github.com/flocasts/flagpole')
    .wrap(Math.min(100, yargs.terminalWidth()))
    .fail(function (msg, err, yargs) {
        Cli.log(yargs.help());
        Cli.log(msg);
        Cli.exit(1);
    })
    .argv;

// Enforce limited list of commands
Cli.command = argv._[0];
Cli.commandArg = argv._[1];
if (commands.indexOf(String(Cli.command)) < 0) {
    Cli.log("Command must be either: " + commands.join(", ") + "\n");
    Cli.log("Example: flagpole run\n");
    Cli.exit(1);
}

/**
 * Settings
 */
Cli.environment = argv.e;
Cli.hideBanner = argv.h;
Cli.rootPath = Cli.normalizePath(typeof argv.p !== 'undefined' ? argv.p : process.cwd());

/**
 * Override default path
 */
if (argv.p) {
    require('./path').path();
}

/**
 * Read the config file in the path
 */
Cli.configPath = (argv.c || Cli.rootPath + 'flagpole.json');
// If we found a config file at this path
Cli.config = Cli.parseConfigFile(Cli.configPath);
if (Cli.config.isValid()) {
    Cli.testsPath = Cli.config.testsPath || process.cwd() + '/tests/';
}
// If they specified a command line config that doesn't exist
else if (argv.c) {
    Cli.log("The config file you specified did not exist.\n");
    Cli.exit(1);
}

/**
 * Determine the root tests folder
 */
Cli.testsPath = (function() {
    // Get command line args
    let path: string = Cli.normalizePath(Cli.testsPath || process.cwd() + '/tests/');
    let group: string = (typeof argv.g !== 'undefined') ? argv.g : '';
    // Make sure path has trailing slashes
    path = Cli.normalizePath(path);
    // Now build our output
    return path + group;
})();

/**
 * Show debug info
 */
if (argv.d) {
    require('./debug').debug(argv);
}

/**
 * Do stuff
 */
if (Cli.command == 'list') {
    require('./list').list();
}
else if (Cli.command== 'run') {
    require('./run').run(argv.s);
}
else if (Cli.command == 'login') {
    require('./login').login();
}
else if (Cli.command == 'logout') {
    require('./logout').logout();
}
else if (Cli.command == 'init') {
    require('./init').init();
}
else if (Cli.command == 'pack') {
    require('./pack').pack();
}
else if (Cli.command == 'add') {
    require('./add').add();
}
else if (Cli.command == 'deploy') {
    require('./deploy').deploy();
}