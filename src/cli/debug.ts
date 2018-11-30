import { Cli } from "./cli-helper";

export function debug(argv) {
    Cli.log('DEBUG INFO');
    Cli.log('');
    Cli.log('Config File:');
    Cli.list([
        'Path: ' + Cli.configPath,
        'Status: ' + (Cli.config.isValid() ? 'Loaded' : 'Not Found'),
    ]);
    Cli.log('');
    if (Cli.config.isValid()) {
        Cli.log('Config Values:');
        Cli.list([
            'Config file directory: ' + Cli.config.getConfigFolder(),
            'Tests directory: ' + Cli.config.getTestsFolder()
        ]);
    }
    Cli.log('');
    Cli.log('Command Line Arguments:')
    Cli.list([
        'Environment: ' + argv.e,
        'Group: ' + argv.g,
        'Suite: ' + argv.s.join(', '),
        'Path: ' + argv.p,
        'Config: ' + argv.c,
        'Debug: ' + argv.d
    ]);
    Cli.log('');
    Cli.log('Other settings:')
    Cli.list([
        'Environment: ' + Cli.environment,
        'Root Path: ' + Cli.rootPath,
        'Tests Path: ' + Cli.testsPath
    ]);
    Cli.log('');

}