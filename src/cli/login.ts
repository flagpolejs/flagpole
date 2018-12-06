import { Cli, printSubheader, printHeader } from "./cli-helper";
import { ClorthoService, iCredentials } from 'clortho-lite';

const request = require('request');
const { prompt } = require('enquirer');

const loginEndPoint: string = 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net/api/token';
const serviceName: string = 'Flagpole JS';
const service: ClorthoService = new ClorthoService(serviceName);

function promptForLogin() {
    prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email Address',
            validate: function (input) {
                return (/^[^ @]{1,32}@[^ ]{3,}\.[a-z]{2,8}/i.test(input));
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password',
            validate: function (input) {
                return (/^.{3,16}$/i.test(input));
            }
        }
    ]).then(function (answers) {

        Cli.hideBanner = true;
        //console.log(answers);

        request.post(
            loginEndPoint,
            {
                body: JSON.stringify({ email: answers.email, password: answers.password }),
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            function (err, response, body) {
                Cli.log('');
                if (err) {
                    Cli.log(err);
                    Cli.log('');
                    Cli.exit(1);
                }
                if (response.statusCode == 201) {
                    let json = JSON.parse(body);
                    if (/[a-z0-9]{16}/.test(json.data.token)) {
                        service.set('email', answers.email);
                        service.set('token', json.data.token)
                            .then(function (value) {
                                Cli.log('Logged in. Saved to your keychain.');
                                Cli.log('');
                                Cli.exit(0);
                            })
                            .catch(function (err) {
                                Cli.log('Error saving credentials to your keychain.');
                                Cli.log('');
                                Cli.exit(0);
                            });
                        
                    }
                    else {
                        Cli.log('Login failed.');
                        Cli.log('');
                        Cli.exit(1);
                    }
                }
                else {
                    Cli.log('Error logging in. Status code: ' + response.statusCode);
                    Cli.log('');
                    Cli.exit(1);
                }

            }
        );

    }).catch(function (err) {
        Cli.log('Error: ' + err);
        Cli.log('');
        Cli.exit(1);
    });
}

export function login() {

    printHeader();
    printSubheader('Login to FlagpoleJS.com');

    Cli.hideBanner = true;
    Cli.log('');
    Cli.log('This site is in early private beta.');

    Cli.getCredentials().then(function (credentials: { email: string, token: string }) {
        Cli.log('');
        Cli.log('You are already logged in as ' + credentials.email);
        Cli.log('');
        Cli.log('To sign in with a different account use the command: flagpole logout');
        Cli.log('');
        Cli.exit(0);
    }).catch(function () {
        promptForLogin();
    });
    
}