"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_helper_1 = require("./cli-helper");
function about() {
    cli_helper_1.Cli.hideBanner = true;
    cli_helper_1.printHeader();
    cli_helper_1.printSubheader('About Flagpole JS');
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('Created and Open Sourced by FloSports');
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('Credits:');
    cli_helper_1.Cli.list([
        'Jason Byrne',
        'Russell Brewer',
        'Arianne Archer'
    ]);
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.log('More info: http://www.flagpolejs.com');
    cli_helper_1.Cli.log('Source: https://www.npmjs.com/package/flagpole');
    cli_helper_1.Cli.log('');
    cli_helper_1.Cli.exit(0);
}
exports.about = about;
