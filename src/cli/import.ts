import { printSubheader, Cli, printHeader } from './cli-helper';

const { prompt } = require('enquirer');
const fs = require('fs');

export function importSuite() {

    Cli.hideBanner = true;
    printHeader();
    printSubheader('Import Suite');

    // Find all suite files in the tests folder
    let suitesInFolder: string[] = [];
    function findSuites(dir: string, isSubFolder: boolean = false) {
        // Does this folder exist?
        if (fs.existsSync(dir)) {
            // Read contents
            let files = fs.readdirSync(dir);
            files.forEach(function (file) {
                // Drill into sub-folders, but only once!
                if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
                    findSuites(dir + file + '/', true);
                }
                // Push in any JS files
                else if (file.match(/.js$/)) {
                    let name: string = (dir + file).replace(Cli.config.getTestsFolder(), '').replace(/\.js$/i, '');
                    suitesInFolder.push(name);
                }
            });
        }
    };
    findSuites(Cli.config.getTestsFolder());

    // Can't import if they already are in config
    let suitesAvailableToImport: string[] = [];
    let suitesInConfig: string[] = Cli.config.getSuiteNames();
    suitesInFolder.forEach(function (suiteName: string) {
        if (!suitesInConfig.includes(suiteName)) {
            suitesAvailableToImport.push(suiteName);
        }
    });

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