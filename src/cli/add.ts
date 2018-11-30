import { printHeader, printSubheader, Cli } from "./cli-helper";
import { EnvConfig } from "./config";

const { prompt } = require('enquirer');
const fs = require('fs');

const typesOfTest: {} = {
    'HTML Page': 'html',
    'REST API (JSON Format)': 'json'
};

const canAdd: string[] = [
    'suite', 'scenario', 'env'
];

function addSuite() {


    printSubheader('Add New Suite');

    if (!Cli.config.isValid()) {
        Cli.log('Config file is invalid.');
        Cli.exit(1);
    }

    // Standard questions
    let questions: any[] = [
        {
            type: 'input',
            name: 'suiteName',
            message: 'Name of Suite',
            initial: 'smoke',
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

    // Ask for a domain for each env
    if (Cli.config.getEnvironments().length <= 1) {
        questions.push({
            type: 'input',
            name: 'baseDomain',
            message: 'Base Domain',
            initial: 'https://www.google.com',
            result: function (input) {
                return input.trim();
            },
            validate: function (input) {
                return /^.{1,63}$/i.test(input);
            }
        });
    }
    else {
        Cli.config.getEnvironments().forEach(function (env: EnvConfig) {
            questions.push({
                type: 'input',
                name: 'baseDomain_' + env.name,
                message: 'Base Domain for ' + env,
                initial: 'https://www.google.com',
                result: function (input) {
                    return input.trim();
                },
                validate: function (input) {
                    return /^.{1,63}$/i.test(input);
                }
            });
        });
    }

    // Lastly add the scenario path
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
        //Cli.log(JSON.stringify(answers));

        let suitePath: string = Cli.config.getTestsFolder() + answers.suiteName + '.js';
        let domains: string = '';

        if (answers.baseDomain) {
            domains = "'" + answers.baseDomain + "'";
        }
        else {
            domains += "{\n";
            Cli.config.getEnvironments().forEach(function (env: EnvConfig) {
                domains += '      ' + env.name + ": '" + answers['baseDomain_' + env.name] + "',\n";
            });
            domains += "   }";
        }

        let fileContents: string = "const { Flagpole } = require('flagpole');\n" +
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

        Cli.log('');

        fs.writeFile(suitePath, fileContents, function (err) {
            if (err) {

                Cli.log('Error creating scenario!');
                Cli.log('Tried to write to: ' + suitePath);
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }

            Cli.config.addSuite(answers.suiteName);
            fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (err) {
                if (err) {
                    Cli.log('Error creating scenario!');
                    Cli.log('Failed updating config: ' + Cli.config.getConfigPath());
                    Cli.log('Got Error: ' + err);
                    Cli.log('');
                    Cli.exit(1);
                }

                Cli.log('Created new test suite.');
                Cli.list([
                    'Suite file created: ' + suitePath,
                    'Scenario added: ' + answers.scenarioDescription,
                    'Config file updated'
                ]);
                Cli.log('');
                Cli.exit(0);

            });
           
        });

    });

}

function addScenario() {

    printSubheader('Add New Scenaio');

    let suites: string[] = Cli.config.getSuiteNames();

    if (suites.length == 0) {
        Cli.log('');
        Cli.log('You have not created any test suites yet. You should do that first.');
        Cli.log('');
        Cli.log('To add a test suite:')
        Cli.log('flagpole add suite');
        Cli.log('');
        Cli.exit(1);
    }

    prompt([
        {
            type: 'select',
            name: 'suite',
            message: 'What suite do you want to add it to?',
            initial: 0,
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

        //Cli.log(JSON.stringify(answers));

        let suitePath: string = Cli.testsPath + answers.suite + '.js';

        let fileContents: string = "\n\n" +
            "suite.Scenario('" + answers.scenarioDescription + "')\n" +
            "   .open('" + answers.scenarioPath + "')\n" +
            "   ." + typesOfTest[answers.type] + "()\n" +
            "   .assertions(function (response) {\n" +
            "       \n" +
            "   });\n";

        if (!fs.existsSync(suitePath)) {
            Cli.log('Something weird happened. Could not find suite:')
            Cli.log(suitePath);
            Cli.exit(2);
        }

        fs.appendFile(suitePath, fileContents, function (err) {
            Cli.log('');
            if (err) {
                Cli.log('Error creating scenario!');
                Cli.log('Tried to write to: ' + suitePath);
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            Cli.log('Appended new scenario to suite:');
            Cli.log(suitePath);
            Cli.log('');
            Cli.log('Scenario added to that suite:');
            Cli.log(answers.scenarioDescription);
            Cli.log('');
            Cli.exit(0);
        });

    }).catch(function (err) {
        Cli.log('Error: ' + err);
        Cli.exit(1);
    });

}


function addEnv() {
    printSubheader('Add New Environment');
    prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What do you want to call the environment?',
            validate: function (input) {
                return /^[a-z0-9]{1,12}$/i.test(input);
            }
        }
    ]).then(function (answers) {
        Cli.config.addEnvironment(answers.name);
        fs.writeFile(Cli.config.getConfigPath(), Cli.config.toString(), function (err) {
            if (err) {
                Cli.log('Error creating environment!');
                Cli.log('Failed updating config: ' + Cli.config.getConfigPath());
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            Cli.log('Added new environment.');
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


export function add() {

    Cli.hideBanner = true;
    printHeader();

    if (!canAdd.includes(Cli.commandArg || '')) {
        Cli.log('');
        Cli.log('You can add: ' + canAdd.join(', '));
        Cli.log('Example syntax: flagpole add suite');
        Cli.log('');
        Cli.exit(1);
    }
    else if (Cli.commandArg == 'scenario') {
        addScenario();
    }
    else if (Cli.commandArg == 'env') {
        addEnv();
    }
    else {
        addSuite();
    }


}