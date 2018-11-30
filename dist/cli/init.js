"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const config_1 = require("./config");
const { prompt } = require('enquirer');
const fs = require('fs');
function init() {
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Initialize Flagpole Project');
    prompt([
        {
            type: 'input',
            name: 'project',
            message: 'What is the name of your project?',
            initial: process.cwd().split('/').pop(),
            result: function (input) {
                return input.trim();
            }
        },
        {
            type: 'input',
            name: 'path',
            message: 'What subfolder do you want to put your tests in?',
            initial: 'tests',
            result: function (input) {
                return input.trim();
            }
        },
        {
            type: 'select',
            name: 'env',
            message: 'What environments do you want to support?',
            initial: 0,
            multiple: true,
            choices: [
                'dev',
                'stag',
                'prod',
                'qa',
                'rc',
                'preprod',
                'alpha',
                'beta'
            ],
            validate: function (input) {
                return (input.length > 0);
            }
        }
    ]).then(function (answers) {
        cli_helper_1.Cli.hideBanner = true;
        cli_helper_1.Cli.log('Creating your Flagpole project...');
        let folder = process.cwd() + '/' + answers.path;
        let configFilePath = process.cwd() + '/flagpole.json';
        let tasks = [];
        let configFile = new config_1.FlagpoleConfig({
            configPath: configFilePath,
            project: answers.project,
            path: answers.path,
        });
        answers.env.forEach(env => {
            configFile.addEnvironment(env);
        });
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            tasks.push('Created tests folder: ' + folder);
        }
        else {
            tasks.push('Tests folder already existed: ' + folder);
        }
        fs.writeFile(configFilePath, configFile.toString(), function (err) {
            if (err) {
                tasks.push('Error creating project config file: ' + configFilePath);
                cli_helper_1.Cli.list(tasks);
                cli_helper_1.Cli.log('Error creating project!');
                cli_helper_1.Cli.exit(1);
            }
            else {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Config options:');
                cli_helper_1.Cli.list([
                    'Project: ' + configFile.projectName,
                    'Test Path: ' + configFile.getTestsFolder(),
                    'Environments: ' + answers.env
                ]);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Completed:');
                tasks.push('Writing project config file: ' + configFilePath);
                cli_helper_1.Cli.list(tasks);
                cli_helper_1.Cli.log('Your Flagpole project was created.');
                cli_helper_1.Cli.exit(0);
            }
        });
    });
}
exports.init = init;
