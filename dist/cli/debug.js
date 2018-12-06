"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const __1 = require("..");
function debug(argv) {
    cli_helper_1.Cli.log('DEBUG INFO');
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('Config File:');
    cli_helper_1.Cli.list([
        'Path: ' + cli_helper_1.Cli.config.getConfigPath(),
        'Status: ' + (cli_helper_1.Cli.config.isValid() ? 'Loaded' : 'Not Found'),
    ]);
    cli_helper_1.Cli.log('');
    if (cli_helper_1.Cli.config.isValid()) {
        cli_helper_1.Cli.log('Config Values:');
        cli_helper_1.Cli.list([
            'Config file directory: ' + cli_helper_1.Cli.config.getConfigFolder(),
            'Tests directory: ' + cli_helper_1.Cli.config.getTestsFolder()
        ]);
    }
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('Command Line Arguments:');
    cli_helper_1.Cli.list([
        'Environment: ' + argv.e,
        'Suite: ' + argv.s.join(', '),
        'Config: ' + argv.c,
        'Debug: ' + argv.d
    ]);
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('Other settings:');
    cli_helper_1.Cli.list([
        'Environment: ' + __1.Flagpole.getEnvironment(),
        'Output: ' + __1.Flagpole.getOutput().toString(),
        'Root Path: ' + cli_helper_1.Cli.config.getConfigFolder(),
        'Tests Path: ' + cli_helper_1.Cli.config.getTestsFolder()
    ]);
    cli_helper_1.Cli.log('');
}
exports.debug = debug;
