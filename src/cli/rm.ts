import { printSubheader, printHeader } from "./cli-helper";
import { Cli } from './cli';
const { prompt } = require('enquirer');

const fs = require('fs');

const canAdd: string[] = [
    'env', 'suite'
];

function removeEnv() {
    printHeader();
    printSubheader('Remove Environment');

    let envs: string[] = Cli.config.getEnvironmentNames();

    if (envs.length == 0) {
        Cli.log('');
        Cli.log('There are no environments defined in this project.');
        Cli.log('');
        Cli.exit(1);
    }

    prompt({
        type: 'select',
        name: 'name',
        message: 'Which environment do you want to remove?',
        initial: envs.indexOf(Cli.commandArg2 || '') || 0,
        choices: envs,
        validate: function (input) {
            return /^[a-z0-9]{1,12}$/i.test(input);
        }
    }).then(function (answers) {
        Cli.config.removeEnvironment(answers.name);
        fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (err) {
            if (err) {
                Cli.log('Error removing environment!');
                Cli.log('Failed updating config: ' + Cli.config.getConfigPath());
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            Cli.log('Removed environment ' + answers.name);
            Cli.list([
                'Config file updated'
            ]);
            Cli.log('');
            Cli.exit(0);

        });

    }).catch(function (err) {
        Cli.log('Error: ' + err);
        Cli.exit(1);
    });
}

function removeSuite() {
    printHeader();
    printSubheader('Remove Suite');

    let suites: string[] = Cli.config.getSuiteNames();

    if (suites.length == 0) {
        Cli.log('');
        Cli.log('There are no suites in this project.');
        Cli.log('');
        Cli.exit(1);
    }

    prompt({
        type: 'select',
        name: 'name',
        message: 'Which suite do you want to remove?',
        choices: suites,
        initial: suites.indexOf(Cli.commandArg2 || '') || 0,
        validate: function (input) {
            return /^[a-z0-9]{1,12}$/i.test(input);
        }
    }).then(function (answers) {
        Cli.config.removeSuite(answers.name);
        fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (err) {
            if (err) {
                Cli.log('Error removing suite!');
                Cli.log('Failed updating config: ' + Cli.config.getConfigPath());
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            Cli.log('Removed suite ' + answers.name);
            Cli.list([
                'Config file updated',
                'Did not delete suite file (so you can add it back if you need)'
            ]);
            Cli.log('');
            Cli.exit(0);

        });

    }).catch(function (err) {
        Cli.log('Error: ' + err);
        Cli.exit(1);
    });
}


export function rm() {
    Cli.hideBanner = true;

    if (Cli.commandArg == 'env') {
        removeEnv();
    } 
    else {
        removeSuite();
    }

}