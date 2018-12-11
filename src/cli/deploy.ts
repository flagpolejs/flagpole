import { createZipArchive } from "./pack";
import { Cli, printHeader, printSubheader } from "./cli-helper";

const request = require('request');
const FormData = require('form-data');
const fs = require('fs');

const uploadPackage = function(token: string) {

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
        let uri: string = Cli.apiDomain + '/api/project/' + Cli.config.project.id + '/package';
        request.post({
            url: uri,
            formData: {
                token: token,
                file: fs.createReadStream(fileName)
            }
        }, function (err, response, body) {
            // Error sending
            if (err) {
                Cli.log('');
                Cli.log('Error Deploying: ' + err);
                Cli.log('');
                Cli.exit(1);
            }
            // Got back a 202
            if (response.statusCode == 202) {
                Cli.log('');
                Cli.log('Project ' + Cli.config.project.name + ' was posted to your account on FlagpoleJS.com');
                Cli.log('');
                Cli.exit(0);
            }
            // Not a 202
            else {
                Cli.log('');
                Cli.log('Error Uploading Deploy (' + response.statusCode + ')');
                Cli.log(body);
                Cli.log('');
                Cli.exit(1);
            }
        });
    });

}

function uploadProject(token: string) {

    if (!Cli.config.project.hasId()) {
        request.post(
            Cli.apiDomain + '/api/project',
            {
                body: JSON.stringify({
                    token: token,
                    name: Cli.config.project.name
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            function (err, response, body) {
                let json = JSON.parse(body);
                Cli.config.project.id = json.data.id || '';
                Cli.config.save().then(function () {
                    uploadPackage(token);
                }).catch(function (err) {
                    Cli.log('');
                    Cli.log('Error uploading project: ' + err);
                    Cli.log('');
                    Cli.exit(1);
                });
            });
    }
    else {
        uploadPackage(token);
    }

}

export function deploy() {

    Cli.hideBanner = true;
    printHeader();
    printSubheader('Deploy Project to FlagpoleJS.com');

    Cli.getCredentials().then(function (credentials: { email: string, token: string }) {
        uploadProject(credentials.token);
    }).catch(function (err) {
        Cli.log('');
        Cli.log(err + ' Must be logged in to deploy.');
        Cli.log('Use command: flagpole login');
        Cli.log('Create an account at: http://www.flagpolejs.com')
        Cli.log('');
        Cli.exit(0);  
    });
    
}