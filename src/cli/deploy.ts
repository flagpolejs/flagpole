import { createZipArchive } from "./pack";
import { Cli } from "./cli-helper";

const keytar = require('keytar');
const request = require('request');
const fs = require('fs');

const deployEndPoint: string = 'http://flagpolejs.com/package/upload/';
const serviceName: string = 'Flagpole JS';

function uploadProject(email: string, token: string) {

    createZipArchive(process.cwd() + '/flagpole.zip', function (err: any, fileName: string) {
        // If the packager returned an error
        if (err) {
            Cli.log('');
            Cli.log('Error: ' + err);
            Cli.log('');
            Cli.exit(1);
        }
        // Make sure the file exists
        if (!fs.existsSync(fileName)) {
            Cli.log('');
            Cli.log('Error generating package.');
            Cli.log('');
            Cli.exit(1);
        }
        // Okay let's send it then
        let uri: string = deployEndPoint + Cli.config.projectName + '?email=' + email + '&token=' + token;
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
            // Error sending
            if (err) {
                Cli.log('');
                Cli.log('Error Deploying: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            // Got back a 200
            if (response.statusCode == 200) {
                if (body == 'ok') {
                    Cli.log('');
                    Cli.log('Deployed.');
                    Cli.log('');
                    Cli.exit(0);
                }
                else {
                    Cli.log('');
                    Cli.log('Error sending: ' + body);
                    Cli.log(uri);
                    Cli.log('');
                    Cli.exit(0);
                }
            }
            // Not a 200
            else {
                Cli.log('');
                Cli.log('Error Uploading Deploy: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
        });
    });

}

export function deploy() {

    keytar.findCredentials(serviceName)
        .then(function (credentials) {
            if (credentials.length == 0) {
                Cli.log('You are not logged in. Must be logged in to deploy.');
                Cli.log('Use command: flagpole login');
                Cli.log('Create an account at: http://www.flagpolejs.com')
                Cli.log('');
                Cli.exit(0);
            }
            else {
                uploadProject(credentials[0].account, credentials[0].password);
            }
        })
        .catch(function (err) {
            Cli.log('');
            Cli.log('Error getting credentials from keyhain: ' + err);
            Cli.log('');
            Cli.exit(1);
        });
    
}