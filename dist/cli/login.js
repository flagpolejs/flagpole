"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const request = require('request');
const { prompt } = require('enquirer');
const keytar = require('keytar');
const loginEndPoint = 'http://167.99.7.190/login/post_login';
function login() {
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Login to FlagpoleJS.com');
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
        request.post(loginEndPoint, { form: { email: answers.email, pwd: answers.password } }, function (err, response, data) {
            cli_helper_1.Cli.log('');
            if (err) {
                cli_helper_1.Cli.log(err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            if (response.statusCode == 200) {
                if (/[a-z0-9]{16}/.test(data)) {
                    keytar.setPassword('Flagpole JS', answers.email, data);
                    cli_helper_1.Cli.log('Logged in. Saved to your keychain.');
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.exit(0);
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
    });
}
exports.login = login;
