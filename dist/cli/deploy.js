"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pack_1 = require("./pack");
const cli_helper_1 = require("./cli-helper");
const keytar = require('keytar');
const request = require('request');
const fs = require('fs');
const deployEndPoint = 'http://flagpolejs.com/package/upload/';
const serviceName = 'Flagpole JS';
function uploadProject(email, token) {
    pack_1.createZipArchive(process.cwd() + '/flagpole.zip', function (err, fileName) {
        if (err) {
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.log('Error: ' + err);
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(1);
        }
        if (!fs.existsSync(fileName)) {
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.log('Error generating package.');
            cli_helper_1.Cli.log('');
            cli_helper_1.Cli.exit(1);
        }
        let uri = deployEndPoint + cli_helper_1.Cli.config.projectName + '?email=' + email + '&token=' + token;
        request({
            method: 'POST',
            preambleCRLF: true,
            postambleCRLF: true,
            uri: uri,
            formData: {
                file: fs.createReadStream(fileName),
                filetype: 'zip',
                filename: 'flagpole.zip',
                email: email,
                token: token,
            },
        }, function (err, response, body) {
            if (err) {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Error Deploying: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
            if (response.statusCode == 200) {
                if (body == 'ok') {
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.log('Project ' + cli_helper_1.Cli.config.projectName + ' was posted to your account on FlagpoleJS.com');
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.exit(0);
                }
                else {
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.log('Error sending: ' + body);
                    cli_helper_1.Cli.log('');
                    cli_helper_1.Cli.exit(0);
                }
            }
            else {
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.log('Error Uploading Deploy: ' + err);
                cli_helper_1.Cli.log('');
                cli_helper_1.Cli.exit(1);
            }
        });
    });
}
function deploy() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('Deploy Project to FlagpoleJS.com');
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
            uploadProject(credentials[0].account, credentials[0].password);
        }
    })
        .catch(function (err) {
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.log('Error getting credentials from keyhain: ' + err);
        cli_helper_1.Cli.log('');
        cli_helper_1.Cli.exit(1);
    });
}
exports.deploy = deploy;
