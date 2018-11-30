import { printSubheader, Cli } from "./cli-helper";
const { prompt } = require('enquirer');

const fs = require('fs');

const canAdd: string[] = [
    'env', 'suite'
];

function removeEnv() {
    printSubheader('Remove Environment');

    prompt({
        type: 'select',
        name: 'name',
        message: 'Which environment do you want to remove?',
        choices: Cli.config.getEnvironmentNames(),
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
    printSubheader('Remove Suite');

    prompt({
        type: 'select',
        name: 'name',
        message: 'Which suite do you want to remove?',
        choices: Cli.config.getSuiteNames(),
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

    if (Cli.commandArg == 'env') {
        removeEnv();
    } 
    else {
        removeSuite();
    }

}