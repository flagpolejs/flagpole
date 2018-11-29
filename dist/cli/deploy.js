"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pack_1 = require("./pack");
const cli_helper_1 = require("./cli-helper");
const keytar = require('keytar');
const request = require('request');
const fs = require('fs');
const deployEndPoint = 'http://www.flagpolejs.com/package/';
const serviceName = 'Flagpole JS';
function uploadProject(email, token) {
    pack_1.createZipArchive(process.cwd() + '/flagpole.zip', function (err, fileName) {
        if (err) {
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.log('Error: ' + err);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(1);
        }
        request({
            method: 'PUT',
            preambleCRLF: true,
            postambleCRLF: true,
            uri: deployEndPoint + cli_helper_1.Cli.config.projectName + '?email=' + email + '&token=' + token,
            multipart: [
                { body: fs.createReadStream(fileName) }
            ]
        }, function (err, response, body) {
            if (err) {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Error Deploying: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            if (response.statusCode == 200) {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Deployed.');
                cli_helper_1.Cli.log('Response: ' + body);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(0);
            }
            else {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Error Uploading Deploy: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
        });
        cli_helper_1.Cli.exit(0);
    });
}
function deploy() {
    keytar.findCredentials(serviceName)
        .then(function (credentials) {
        if (credentials.length == 0) {
            cli_helper_1.Cli.log('You are not logged in. Must be logged in to deploy.');
            cli_helper_1.Cli.log('Use command: flagpole login');
            cli_helper_1.Cli.log('Create an account at: http://www.flagpolejs.com');
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(0);
        }
        else {
            uploadProject(credentials[0].email, credentials[0].password);
        }
    })
        .catch(function (err) {
        console.log(err);
    });
}
exports.deploy = deploy;
