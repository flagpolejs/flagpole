import { createZipArchive } from "./pack";
import { Cli, printHeader, printSubheader } from "./cli-helper";
import { ClorthoService, iCredentials } from 'clortho-lite';
import { request } from 'request';

const serviceName: string = 'Flagpole JS';
const service: ClorthoService = new ClorthoService(serviceName);

const deployEndPoint: string = 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net/api/project/';


function uploadProject(email: string, token: string) {

    if (Cli.config.project.hasId()) {
        request.post(
            'https://us-central1-flagpolejs-5ea61.cloudfunctions.net/api/project',
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
                    
                }).catch(function () {
                    
                });
            });
    }

    /*

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
                    Cli.log('Project ' + Cli.config.projectName + ' was posted to your account on FlagpoleJS.com');
                    Cli.log('');
                    Cli.exit(0);
                }
                else {
                    Cli.log('');
                    Cli.log('Error sending: ' + body);
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

    */

}

export function deploy() {

    Cli.hideBanner = true;
    printHeader();
    printSubheader('Deploy Project to FlagpoleJS.com');

    Promise.all([
        service.get('email'),
        service.get('token')
    ]).then(function (credentials: iCredentials[]) {
        uploadProject(credentials[0].password, credentials[1].password);
    }).catch(function (err) {
        Cli.log('');
        Cli.log('You are not logged in. Must be logged in to deploy.');
        Cli.log('Use command: flagpole login');
        Cli.log('Create an account at: http://www.flagpolejs.com')
        Cli.log('');
        Cli.exit(0);  
    });
    
}