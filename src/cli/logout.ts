import { printHeader, printSubheader, Cli } from "./cli-helper";

const keytar = require('keytar');

export function logout() {

    const serviceName: string = 'Flagpole JS';

    Cli.hideBanner = true;

    printHeader();
    printSubheader('Logout of FlagpoleJS.com');

    keytar.findCredentials(serviceName)
        .then(function (credentials) {

            Cli.log('');

            if (credentials.length == 0) {
                Cli.log('You were not logged in.');
                Cli.log('');
                Cli.exit(0);
            }
            else {

                keytar.deletePassword(serviceName, credentials[0].account)
                    .then(function (result) {
                        Cli.log('Logged you out of account: ' + credentials[0].account);
                        Cli.log('');
                        Cli.exit(0);
                    })
                    .catch(function (err) {
                        Cli.log(err); 
                        Cli.log('');
                        Cli.exit(1);
                    });
                
            }

        })
        .catch(function (err) {
            Cli.log(err);
            Cli.log('');
            Cli.exit(1);
        });
    
}

