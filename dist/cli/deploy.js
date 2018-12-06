"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
const clortho_lite_1 = require("clortho-lite");
const request = require('request');
const serviceName = 'Flagpole JS';
const service = new clortho_lite_1.ClorthoService(serviceName);
function uploadProject(token) {
    if (!cli_helper_1.Cli.config.project.hasId()) {
        request.post(cli_helper_1.Cli.apiDomain + '/api/project', {
            body: JSON.stringify({
                token: token,
                name: cli_helper_1.Cli.config.project.name
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }, function (err, response, body) {
            let json = JSON.parse(body);
            cli_helper_1.Cli.config.project.id = json.data.id || '';
            cli_helper_1.Cli.config.save().then(function () {
            }).catch(function () {
            });
        });
    }
}
function deploy() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Deploy Project to FlagpoleJS.com');
    cli_helper_1.Cli.getCredentials().then(function (credentials) {
        uploadProject(credentials.token);
    }).catch(function (err) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log(err + ' Must be logged in to deploy.');
        cli_helper_1.Cli.log('Use command: flagpole login');
        cli_helper_1.Cli.log('Create an account at: http://www.flagpolejs.com');
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(0);
    });
}
exports.deploy = deploy;
