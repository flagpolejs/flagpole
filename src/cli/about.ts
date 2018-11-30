import { Cli, printHeader, printSubheader } from "./cli-helper";


export function about() {

    Cli.hideBanner = true;
    printHeader();
    printSubheader('About Flagpole JS');
    Cli.log('');
    Cli.log('Created and Open Sourced by FloSports');
    Cli.log('');
    Cli.log('Credits:');
    Cli.list([
        'Jason Byrne',
        'Russell Brewer',
        'Arianne Archer'
    ])
    Cli.log('');
    Cli.log('More info: http://www.flagpolejs.com');
    Cli.log('Source: https://www.npmjs.com/package/flagpole');
    Cli.log('');
    Cli.exit(0);

}