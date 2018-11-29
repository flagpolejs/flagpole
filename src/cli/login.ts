import { Cli, printSubheader, printHeader } from "./cli-helper";

const request = require('request');
const { prompt } = require('enquirer');
const keytar = require('keytar');

const loginEndPoint: string = 'http://167.99.7.190/login/post_login';

export function login() {

    printHeader();
    printSubheader('Login to FlagpoleJS.com');

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
            { form: { email: answers.email, pwd: answers.password } },
            function (err, response, data) {
                Cli.log('');
                if (err) {
                    Cli.log(err);
                    Cli.log('');
                    Cli.exit(1);
                }
                if (response.statusCode == 200) {
                    if (/[a-z0-9]{16}/.test(data)) {
                        keytar.setPassword('Flagpole JS', answers.email, data);
                        Cli.log('Logged in. Saved to your keychain.');
                        Cli.log('');
                        Cli.exit(0);
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

    })

}