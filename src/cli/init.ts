import { printSubheader, printHeader } from "./cli-helper";
import { Cli } from './cli';
import { FlagpoleConfig } from "./config";

const { prompt } = require('enquirer');
const fs = require('fs');

export function init() {

    printHeader();
    printSubheader('Initialize Flagpole Project');

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
        Cli.hideBanner = true;
        Cli.log('Creating your Flagpole project...')
        let folder: string = process.cwd() + '/' + answers.path;
        let configFilePath: string = process.cwd() + '/flagpole.json';
        let tasks: string[] = [];

        let configFile: FlagpoleConfig = new FlagpoleConfig({
            configPath: configFilePath,
            project: {
                name: answers.project,
                path: answers.path
            }
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
                Cli.list(tasks);
                Cli.log('Error creating project!');
                Cli.exit(1);
            }
            else {
                Cli.log('');
                Cli.log('Config options:')
                Cli.list([
                    'Project: ' + configFile.project.name,
                    'Test Path: ' + configFile.getTestsFolder(),
                    'Environments: ' + answers.env
                ])
                Cli.log('');
                Cli.log('Completed:');
                tasks.push('Writing project config file: ' + configFilePath);
                Cli.list(tasks);
                Cli.log('Your Flagpole project was created.');
                Cli.exit(0);
            }
        });
        
    })

}