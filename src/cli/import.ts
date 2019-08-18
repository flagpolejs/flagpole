import { printSubheader, printHeader } from './cli-helper';
import { Cli } from './cli';

const { prompt } = require('enquirer');
const fs = require('fs');

export function importSuite() {

    Cli.hideBanner = true;
    printHeader();
    printSubheader('Import Suite');
    
    let suitesAvailableToImport: string[] = Cli.findDetachedSuites();

    // If no suites available to import
    if (suitesAvailableToImport.length == 0) {
        Cli.log('');
        Cli.log('There were no JS files in tests folder available to import.');
        Cli.log('');
        Cli.exit(0);
    }

    prompt([
        {
            type: 'select',
            name: 'name',
            message: 'Which suite do you want to import?',
            choices: suitesAvailableToImport
        }
    ]).then(function (answers) {

        Cli.config.addSuite(answers.name);
        fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (err) {
            if (err) {
                Cli.log('Error importing suite!');
                Cli.log('Failed updating config: ' + Cli.config.getConfigPath());
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            Cli.log('Imported Suite');
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