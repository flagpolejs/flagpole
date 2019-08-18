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
        const configOptions = {
            projectName: answers.project,
            testsPath: answers.path,
            environments: answers.env
        };
        Cli.hideBanner = true;
        Cli.log('Creating your Flagpole project...')
        Cli.init(configOptions)
            .then((tasks: string[]) => {
                Cli.log('');
                Cli.list(tasks)
                Cli.log('');
                Cli.log('Your Flagpole project was created.');
                Cli.exit(0);
            })
            .catch((err: string) => {
                Cli.log(err);
                Cli.exit(1);
            });        
    })

}