import { printHeader, printSubheader } from "./cli-helper";
import { Cli } from './cli';
import { EnvConfig, SuiteConfig } from "./config";

const { prompt } = require('enquirer');
const fs = require('fs');

const typesOfTest: {} = {
    'HTML Page': 'html',
    'REST API (JSON Format)': 'json',
    'Browser (Puppeteer)': 'browser'
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
            initial: Cli.commandArg2 || 'smoke',
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
    let envs: EnvConfig[] = Cli.config.getEnvironments();
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
        envs.forEach(function (env: EnvConfig) {
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
        let baseDomain: string | { [key: string]: string } = answers.baseDomain;
        if (!baseDomain) {
            baseDomain = {};
            Cli.config.getEnvironments().forEach(function (env: EnvConfig) {
                baseDomain[env.name] = answers['baseDomain_' + env.name];
            });
        }
        Cli.log('');
        Cli.addSuite({
                suiteName: answers.suiteName,
                baseDomain: baseDomain,
                suiteDescription: answers.suiteDescription,
                scenarioDescription: answers.scenarioDescription,
                scenarioType: typesOfTest[answers.type],
                scenarioPath: answers.scenarioPath
            })
            .then(() => {
                Cli.log('Created new test suite.');
                Cli.list([
                    'Suite file created: ' + suitePath,
                    'Scenario added: ' + answers.scenarioDescription,
                    'Config file updated'
                ]);
                Cli.log('');
                Cli.exit(0);
            })
            .catch((err) => {
                Cli.log('Error creating scenario!');
                Cli.log('Tried to write to: ' + suitePath);
                Cli.log('Got Error: ' + err);
                Cli.log('');
                Cli.exit(1);
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
            initial: suites.indexOf(Cli.commandArg2 || '') || 0,
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
    ]).then(function (answers: any) {

        //Cli.log(JSON.stringify(answers));
        const suite: SuiteConfig = Cli.config.suites[answers.suite];
        if (!suite) {
            Cli.log(`Invalid suite: ${answers.suite}`);
            Cli.log('');
            Cli.exit(1);
        }

        Cli.addScenario(suite, {
            description: answers.scenarioDescription,
            path: answers.scenarioPath,
            type: typesOfTest[answers.type]
        }).then(() => {
            Cli.log('Appended new scenario to suite:');
            Cli.log(suite.getPath());
            Cli.log('');
            Cli.log('Scenario added to that suite:');
            Cli.log(answers.scenarioDescription);
            Cli.log('');
            Cli.exit(0);
        }).catch((err) => {
            Cli.log('Error creating scenario!');
            Cli.log('Got Error: ' + err);
            Cli.log('');
            Cli.exit(1);
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
            initial: Cli.commandArg2 || '',
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
        Cli.config.addEnvironment(answers.name, {
            defaultDomain: answers.defaultDomain
        });
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