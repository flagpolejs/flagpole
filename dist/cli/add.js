"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const { prompt } = require('enquirer');
const fs = require('fs');
const typesOfTest = {
    'HTML Page': 'html',
    'REST API (JSON Format)': 'json'
};
const canAdd = [
    'suite', 'scenario', 'env'
];
function addSuite() {
    cli_helper_1.printSubheader('Add New Suite');
    if (!cli_helper_1.Cli.config.isValid()) {
        cli_helper_1.Cli.log('Config file is invalid.');
        cli_helper_1.Cli.exit(1);
    }
    let questions = [
        {
            type: 'input',
            name: 'suiteName',
            message: 'Name of Suite',
            initial: cli_helper_1.Cli.commandArg2 || 'smoke',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^[a-z0-9_-]{1,63}$/i.test(input);
            }
        },
        {
            type: 'input',
            name: 'suiteDescription',
            message: 'Description of Suite',
            initial: 'Basic Smoke Test of Site',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^[a-z0-9].{1,63}$/i.test(input);
            }
        },
        {
            type: 'input',
            name: 'scenarioDescription',
            message: 'First Scenario',
            initial: 'Homepage Loads',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^[a-z0-9].{1,63}$/i.test(input);
            }
        },
        {
            type: 'select',
            name: 'type',
            message: 'What type of test is this scenario?',
            initial: 0,
            choices: Object.keys(typesOfTest)
        }
    ];
    let envs = cli_helper_1.Cli.config.getEnvironments();
    if (envs.length <= 1) {
        questions.push({
            type: 'input',
            name: 'baseDomain',
            message: 'Base Domain',
            initial: envs[0].defaultDomain || 'https://www.google.com',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^.{1,63}$/i.test(input);
            }
        });
    }
    else {
        envs.forEach(function (env) {
            questions.push({
                type: 'input',
                name: 'baseDomain_' + env.name,
                message: 'Base Domain for ' + env.name,
                initial: env.defaultDomain || 'https://www.google.com',
                result: function (input) {
                    return input.trim();
                },
                validate: function (input) {
                    return /^.{1,63}$/i.test(input);
                }
            });
        });
    }
    questions.push({
        type: 'input',
        name: 'scenarioPath',
        message: 'Scenario Start Path',
        initial: '/',
        result: function (input) {
            return input.trim();
        },
        validate: function (input) {
            return /^\/.{0,63}$/i.test(input);
        }
    });
    prompt(questions).then(function (answers) {
        let suitePath = cli_helper_1.Cli.config.getTestsFolder() + answers.suiteName + '.js';
        let domains = '';
        if (answers.baseDomain) {
            domains = "'" + answers.baseDomain + "'";
        }
        else {
            domains += "{\n";
            cli_helper_1.Cli.config.getEnvironments().forEach(function (env) {
                domains += '      ' + env.name + ": '" + answers['baseDomain_' + env.name] + "',\n";
            });
            domains += "   }";
        }
        let fileContents = "const { Flagpole } = require('flagpole');\n" +
            "\n" +
            "const suite = Flagpole.Suite('" + answers.suiteDescription + "')\n" +
            "   .base(" + domains + ");\n" +
            "\n" +
            "suite.Scenario('" + answers.scenarioDescription + "')\n" +
            "   .open('" + answers.scenarioPath + "')\n" +
            "   ." + typesOfTest[answers.type] + "()\n" +
            "   .assertions(function (response) {\n" +
            "       \n" +
            "   });\n";
        cli_helper_1.Cli.log('');
        fs.writeFile(suitePath, fileContents, function (err) {
            if (err) {
                cli_helper_1.Cli.log('Error creating scenario!');
                cli_helper_1.Cli.log('Tried to write to: ' + suitePath);
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.config.addSuite(answers.suiteName);
            fs.writeFile(cli_helper_1.Cli.config.getConfigPath(), cli_helper_1.Cli.config.toString(), function (err) {
                if (err) {
                    cli_helper_1.Cli.log('Error creating scenario!');
                    cli_helper_1.Cli.log('Failed updating config: ' + cli_helper_1.Cli.config.getConfigPath());
                    cli_helper_1.Cli.log('Got Error: ' + err);
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.exit(1);
                }
                cli_helper_1.Cli.log('Created new test suite.');
                cli_helper_1.Cli.list([
                    'Suite file created: ' + suitePath,
                    'Scenario added: ' + answers.scenarioDescription,
                    'Config file updated'
                ]);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(0);
            });
        });
    });
}
function addScenario() {
    cli_helper_1.printSubheader('Add New Scenaio');
    let suites = cli_helper_1.Cli.config.getSuiteNames();
    if (suites.length == 0) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('You have not created any test suites yet. You should do that first.');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('To add a test suite:');
        cli_helper_1.Cli.log('flagpole add suite');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    }
    prompt([
        {
            type: 'select',
            name: 'suite',
            message: 'What suite do you want to add it to?',
            initial: suites.indexOf(cli_helper_1.Cli.commandArg2 || '') || 0,
            choices: suites,
            validate: function (input) {
                return (input.length > 0);
            }
        },
        {
            type: 'select',
            name: 'type',
            message: 'What type of test is this scenario?',
            initial: 0,
            choices: Object.keys(typesOfTest)
        },
        {
            type: 'input',
            name: 'scenarioDescription',
            message: 'Description of Scenario',
            initial: 'Some Other Page Loads',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^[a-z0-9].{1,63}$/i.test(input);
            }
        },
        {
            type: 'input',
            name: 'scenarioPath',
            message: 'Scenario Start Path',
            initial: '/some-other-page',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^\/.{0,63}$/i.test(input);
            }
        }
    ]).then(function (answers) {
        let suitePath = cli_helper_1.Cli.config.getTestsFolder() + answers.suite + '.js';
        let fileContents = "\n\n" +
            "suite.Scenario('" + answers.scenarioDescription + "')\n" +
            "   .open('" + answers.scenarioPath + "')\n" +
            "   ." + typesOfTest[answers.type] + "()\n" +
            "   .assertions(function (response) {\n" +
            "       \n" +
            "   });\n";
        if (!fs.existsSync(suitePath)) {
            cli_helper_1.Cli.log('Something weird happened. Could not find suite:');
            cli_helper_1.Cli.log(suitePath);
            cli_helper_1.Cli.exit(2);
        }
        fs.appendFile(suitePath, fileContents, function (err) {
            cli_helper_1.Cli.log('');
            if (err) {
                cli_helper_1.Cli.log('Error creating scenario!');
                cli_helper_1.Cli.log('Tried to write to: ' + suitePath);
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.log('Appended new scenario to suite:');
            cli_helper_1.Cli.log(suitePath);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.log('Scenario added to that suite:');
            cli_helper_1.Cli.log(answers.scenarioDescription);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        });
    }).catch(function (err) {
        cli_helper_1.Cli.log('Error: ' + err);
        cli_helper_1.Cli.exit(1);
    });
}
function addEnv() {
    cli_helper_1.printSubheader('Add New Environment');
    prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What do you want to call the environment?',
            initial: cli_helper_1.Cli.commandArg2 || '',
            validate: function (input) {
                return /^[a-z0-9]{1,12}$/i.test(input);
            }
        },
        {
            type: 'input',
            name: 'defaultDomain',
            message: 'Default Domain (optional)',
            result: function (input) {
                return input.trim();
            }
        }
    ]).then(function (answers) {
        cli_helper_1.Cli.config.addEnvironment(answers.name, {
            defaultDomain: answers.defaultDomain
        });
        fs.writeFile(cli_helper_1.Cli.config.getConfigPath(), cli_helper_1.Cli.config.toString(), function (err) {
            if (err) {
                cli_helper_1.Cli.log('Error creating environment!');
                cli_helper_1.Cli.log('Failed updating config: ' + cli_helper_1.Cli.config.getConfigPath());
                cli_helper_1.Cli.log('Got Error: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            cli_helper_1.Cli.log('Added new environment.');
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
function add() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    if (!canAdd.includes(cli_helper_1.Cli.commandArg || '')) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('You can add: ' + canAdd.join(', '));
        cli_helper_1.Cli.log('Example syntax: flagpole add suite');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    }
    else if (cli_helper_1.Cli.commandArg == 'scenario') {
        addScenario();
    }
    else if (cli_helper_1.Cli.commandArg == 'env') {
        addEnv();
    }
    else {
        addSuite();
    }
}
exports.add = add;
