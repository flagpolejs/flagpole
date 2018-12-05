"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const clortho_lite_1 = require("clortho-lite");
const serviceName = 'Flagpole JS';
const service = new clortho_lite_1.ClorthoService(serviceName);
function logout() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Logout of FlagpoleJS.com');
    service.get('email')
        .then(function (email) {
        cli_helper_1.Cli.log('');
        service.remove('token');
        service.remove('email')
            .then(function (result) {
            cli_helper_1.Cli.log('Logged you out of account: ' + email.password);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        })
            .catch(function (err) {
            cli_helper_1.Cli.log(err);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(1);
        });
    })
        .catch(function (err) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('You were not logged in.');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(0);
    });
}
exports.logout = logout;
