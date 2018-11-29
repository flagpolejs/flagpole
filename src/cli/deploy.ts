import { createZipArchive } from "./pack";
import { Cli } from "./cli-helper";

const keytar = require('keytar');
const request = require('request');
const fs = require('fs');

const deployEndPoint: string = 'http://www.flagpolejs.com/package/';
const serviceName: string = 'Flagpole JS';

function uploadProject(email: string, token: string) {
    createZipArchive(process.cwd() + '/flagpole.zip', function (err: any, fileName: string) {

        if (err) {
            Cli.log('');
            Cli.log('Error: ' + err);
            Cli.log('');
            Cli.exit(1);
        }

        request({
            method: 'PUT',
            preambleCRLF: true,
            postambleCRLF: true,
            uri: deployEndPoint + Cli.config.projectName + '?email=' + email + '&token=' + token,
            multipart: [
                { body: fs.createReadStream(fileName) }
            ]
        }, function (err, response, body) {
            if (err) {
                Cli.log('');
                Cli.log('Error Deploying: ' + err);
                Cli.log('');
                Cli.exit(1);
            }

            if (response.statusCode == 200) {
                Cli.log('');
                Cli.log('Deployed.');
                Cli.log('Response: ' + body);
                Cli.log('');
                Cli.exit(0);
            }
            else {
                Cli.log('');
                Cli.log('Error Uploading Deploy: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
        });

        Cli.exit(0);
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
                uploadProject(credentials[0].email, credentials[0].password);
            }

        })
        .catch(function (err) {
            console.log(err);
        });
    
}