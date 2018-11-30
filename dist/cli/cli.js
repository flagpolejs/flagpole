#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const fs = require('fs');
let commands = ['run', 'list', 'init', 'add', 'login', 'logout', 'deploy', 'pack', 'about'];
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
    cli_helper_1.Cli.log(yargs.help());
    cli_helper_1.Cli.log(msg);
    cli_helper_1.Cli.exit(1);
})
    .argv;
cli_helper_1.Cli.command = argv._[0];
cli_helper_1.Cli.commandArg = argv._[1];
if (commands.indexOf(String(cli_helper_1.Cli.command)) < 0) {
    cli_helper_1.Cli.log("Command must be either: " + commands.join(", ") + "\n");
    cli_helper_1.Cli.log("Example: flagpole run\n");
    cli_helper_1.Cli.exit(1);
}
cli_helper_1.Cli.environment = argv.e;
cli_helper_1.Cli.hideBanner = argv.h;
cli_helper_1.Cli.rootPath = cli_helper_1.Cli.normalizePath(typeof argv.p !== 'undefined' ? argv.p : process.cwd());
if (argv.p) {
    require('./path').path();
}
cli_helper_1.Cli.configPath = (argv.c || cli_helper_1.Cli.rootPath + 'flagpole.json');
cli_helper_1.Cli.config = cli_helper_1.Cli.parseConfigFile(cli_helper_1.Cli.configPath);
if (cli_helper_1.Cli.config.isValid()) {
    cli_helper_1.Cli.testsPath = cli_helper_1.Cli.config.testsPath || process.cwd() + '/tests/';
}
else if (argv.c) {
    cli_helper_1.Cli.log("The config file you specified did not exist.\n");
    cli_helper_1.Cli.exit(1);
}
cli_helper_1.Cli.testsPath = (function () {
    let path = cli_helper_1.Cli.normalizePath(cli_helper_1.Cli.testsPath || process.cwd() + '/tests/');
    let group = (typeof argv.g !== 'undefined') ? argv.g : '';
    path = cli_helper_1.Cli.normalizePath(path);
    return path + group;
})();
if (argv.d) {
    require('./debug').debug(argv);
}
if (cli_helper_1.Cli.command == 'list') {
    require('./list').list();
}
else if (cli_helper_1.Cli.command == 'run') {
    require('./run').run(argv.s);
}
else if (cli_helper_1.Cli.command == 'login') {
    require('./login').login();
}
else if (cli_helper_1.Cli.command == 'logout') {
    require('./logout').logout();
}
else if (cli_helper_1.Cli.command == 'init') {
    require('./init').init();
}
else if (cli_helper_1.Cli.command == 'pack') {
    require('./pack').pack();
}
else if (cli_helper_1.Cli.command == 'add') {
    require('./add').add();
}
else if (cli_helper_1.Cli.command == 'deploy') {
    require('./deploy').deploy();
}
else if (cli_helper_1.Cli.command == 'about') {
    require('./about').about();
}
