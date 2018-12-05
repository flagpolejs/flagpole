import { printHeader, printSubheader, Cli } from "./cli-helper";
import { ClorthoService } from 'clortho-lite';

const serviceName: string = 'Flagpole JS';
const service: ClorthoService = new ClorthoService(serviceName);

export function logout() {

    Cli.hideBanner = true;

    printHeader();
    printSubheader('Logout of FlagpoleJS.com');

    service.get('email')
        .then(function (email) {
            Cli.log('');
            service.remove('token')
            service.remove('email')
                .then(function (result) {
                    Cli.log('Logged you out of account: ' + email.password);
                    Cli.log('');
                    Cli.exit(0);
                })
                .catch(function (err) {
                    Cli.log(err); 
                    Cli.log('');
                    Cli.exit(1);
                });
        })
        .catch(function (err) {
            Cli.log('');
            Cli.log('You were not logged in.');
            Cli.log('');
            Cli.exit(0);
        });
    
}

