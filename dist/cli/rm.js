"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const { prompt } = require('enquirer');
const fs = require('fs');
const canAdd = [
    'env', 'suite'
];
function removeEnv() {
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Remove Environment');
    let envs = cli_helper_1.Cli.config.getEnvironmentNames();
    if (envs.length == 0) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('There are no environments defined in this project.');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    }
    prompt({
        type: 'select',
        name: 'name',
        message: 'Which environment do you want to remove?',
        initial: envs.indexOf(cli_helper_1.Cli.commandArg2 || '') || 0,
        choices: envs,
        validate: function (input) {
            return /^[a-z0-9]{1,12}$/i.test(input);
        }
    }).then(function (answers) {
        cli_helper_1.Cli.config.removeEnvironment(answers.name);
        fs.writeFile(cli_helper_1.Cli.config.getConfigPath(), cli_helper_1.Cli.config.toString(), function (err) {
            if (err) {
                cli_helper_1.Cli.log('Error removing environment!');
                cli_helper_1.Cli.log('Failed updating config: ' + cli_helper_1.Cli.config.getConfigPath());
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.log('Removed environment ' + answers.name);
            cli_helper_1.Cli.list([
                'Config file updated'
            ]);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        });
    }).catch(function (err) {
        cli_helper_1.Cli.log('Error: ' + err);
        cli_helper_1.Cli.exit(1);
    });
}
function removeSuite() {
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Remove Suite');
    let suites = cli_helper_1.Cli.config.getSuiteNames();
    if (suites.length == 0) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('There are no suites in this project.');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    }
    prompt({
        type: 'select',
        name: 'name',
        message: 'Which suite do you want to remove?',
        choices: suites,
        initial: suites.indexOf(cli_helper_1.Cli.commandArg2 || '') || 0,
        validate: function (input) {
            return /^[a-z0-9]{1,12}$/i.test(input);
        }
    }).then(function (answers) {
        cli_helper_1.Cli.config.removeSuite(answers.name);
        fs.writeFile(cli_helper_1.Cli.config.getConfigPath(), cli_helper_1.Cli.config.toString(), function (err) {
            if (err) {
                cli_helper_1.Cli.log('Error removing suite!');
                cli_helper_1.Cli.log('Failed updating config: ' + cli_helper_1.Cli.config.getConfigPath());
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.log('Removed suite ' + answers.name);
            cli_helper_1.Cli.list([
                'Config file updated',
                'Did not delete suite file (so you can add it back if you need)'
            ]);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        });
    }).catch(function (err) {
        cli_helper_1.Cli.log('Error: ' + err);
        cli_helper_1.Cli.exit(1);
    });
}
function rm() {
    cli_helper_1.Cli.hideBanner = true;
    if (cli_helper_1.Cli.commandArg == 'env') {
        removeEnv();
    }
    else {
        removeSuite();
    }
}
exports.rm = rm;
