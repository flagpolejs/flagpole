"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const keytar = require('keytar');
function logout() {
    const serviceName = 'Flagpole JS';
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Logout of FlagpoleJS.com');
    keytar.findCredentials(serviceName)
        .then(function (credentials) {
        cli_helper_1.Cli.log('');
        if (credentials.length == 0) {
            cli_helper_1.Cli.log('You were not logged in.');
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        }
        else {
            keytar.deletePassword(serviceName, credentials[0].account)
                .then(function (result) {
                cli_helper_1.Cli.log('Logged you out.');
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(0);
            })
                .catch(function (err) {
                cli_helper_1.Cli.log(err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            });
        }
    })
        .catch(function (err) {
        cli_helper_1.Cli.log(err);
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    });
}
exports.logout = logout;
