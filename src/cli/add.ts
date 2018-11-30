import { printHeader, printSubheader, Cli, Tests } from "./cli-helper";

const { prompt } = require('enquirer');
const fs = require('fs');

const typesOfTest: {} = {
    'HTML Page': 'html',
    'REST API (JSON Format)': 'json'
};

const canAdd: string[] = [
    'suite', 'scenario'
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
            name: 'suiteFileName',
            message: 'Name of Suite',
            initial: 'smoke',
            result: function (input) {
                return input.trim() + '.js';
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
    if (Cli.config.env.length <= 1) {
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
        Cli.config.env.forEach(function (env: string) {
            questions.push({
                type: 'input',
                name: 'baseDomain_' + env,
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

        let suitePath: string = Cli.config.testsPath + answers.suiteFileName;
        let domains: string = '';

        if (answers.baseDomain) {
            domains = "'" + answers.baseDomain + "'";
        }
        else {
            domains += "{\n";
            Cli.config.env.forEach(function (env: string) {
                domains += '      ' + env + ": '" + answers['baseDomain_' + env] + "',\n";
            });
            domains += "   }\n";
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
            Cli.log('Created new test suite:');
            Cli.log(suitePath);
            Cli.log('');
            Cli.log('Scenario added to that suite called:');
            Cli.log(answers.suiteDescription);
            Cli.log('');
            Cli.exit(0);
        });

    });

}

function addScenario() {

    printSubheader('Add New Scenaio');

    let tests = new Tests(Cli.testsPath);
    let suites: string[] = tests.getSuiteNames();

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
            Cli.log('Scenario added to that suite called:');
            Cli.log(answers.scenarioDescription);
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
    else {
        addSuite();
    }


}