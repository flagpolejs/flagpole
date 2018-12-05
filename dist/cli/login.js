"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const clortho_lite_1 = require("clortho-lite");
const request = require('request');
const { prompt } = require('enquirer');
const loginEndPoint = 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net/api/token';
const serviceName = 'Flagpole JS';
const service = new clortho_lite_1.ClorthoService(serviceName);
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
        cli_helper_1.Cli.hideBanner = true;
        request.post(loginEndPoint, { body: JSON.stringify({ email: answers.email, password: answers.password }) }, function (err, response, data) {
            cli_helper_1.Cli.log('');
            if (err) {
                cli_helper_1.Cli.log(err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            if (response.statusCode == 200) {
                if (/[a-z0-9]{16}/.test(data)) {
                    service.set('email', answers.email);
                    service.set('token', data)
                        .then(function (value) {
                        cli_helper_1.Cli.log('Logged in. Saved to your keychain.');
                        cli_helper_1.Cli.log('');
                        cli_helper_1.Cli.exit(0);
                    })
                        .catch(function (err) {
                        cli_helper_1.Cli.log('Error saving credentials to your keychain.');
                        cli_helper_1.Cli.log('');
                        cli_helper_1.Cli.exit(0);
                    });
                }
                else {
                    cli_helper_1.Cli.log('Login failed.');
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.exit(1);
                }
            }
            else {
                cli_helper_1.Cli.log('Error logging in. Status code: ' + response.statusCode);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
        });
    }).catch(function (err) {
        cli_helper_1.Cli.log('Error: ' + err);
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    });
}
function login() {
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Login to FlagpoleJS.com');
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('This site is in early private beta.');
    service.get('email')
        .then(function (email) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('You are already logged in as ' + email.password);
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('To sign in with a different account use the command: flagpole logout');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(0);
    })
        .catch(function (err) {
        promptForLogin();
    });
}
exports.login = login;
