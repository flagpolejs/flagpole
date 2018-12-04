"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const { prompt } = require('enquirer');
const fs = require('fs');
function importSuite() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Import Suite');
    let suitesInFolder = [];
    function findSuites(dir, isSubFolder = false) {
        if (fs.existsSync(dir)) {
            let files = fs.readdirSync(dir);
            files.forEach(function (file) {
                if (!isSubFolder && fs.statSync(dir + file).isDirectory()) {
                    findSuites(dir + file + '/', true);
                }
                else if (file.match(/.js$/)) {
                    let name = (dir + file).replace(cli_helper_1.Cli.config.getTestsFolder(), '').replace(/\.js$/i, '');
                    suitesInFolder.push(name);
                }
            });
        }
    }
    ;
    findSuites(cli_helper_1.Cli.config.getTestsFolder());
    let suitesAvailableToImport = [];
    let suitesInConfig = cli_helper_1.Cli.config.getSuiteNames();
    suitesInFolder.forEach(function (suiteName) {
        if (!suitesInConfig.includes(suiteName)) {
            suitesAvailableToImport.push(suiteName);
        }
    });
    if (suitesAvailableToImport.length == 0) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('There were no JS files in tests folder available to import.');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(0);
    }
    prompt([
        {
            type: 'select',
            name: 'name',
            message: 'Which suite do you want to import?',
            choices: suitesAvailableToImport
        }
    ]).then(function (answers) {
        cli_helper_1.Cli.config.addSuite(answers.name);
        fs.writeFile(cli_helper_1.Cli.config.getConfigPath(), cli_helper_1.Cli.config.toString(), function (err) {
            if (err) {
                cli_helper_1.Cli.log('Error importing suite!');
                cli_helper_1.Cli.log('Failed updating config: ' + cli_helper_1.Cli.config.getConfigPath());
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.log('Imported Suite');
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
exports.importSuite = importSuite;
