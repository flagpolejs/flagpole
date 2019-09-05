import { Cli } from './cli';
import { FlagpoleExecution } from '../flagpoleexecutionoptions';


export function debug(argv) {
    Cli.log('DEBUG INFO');
    Cli.log('');
    Cli.log('Config File:');
    Cli.list([
        'Path: ' + Cli.config.getConfigPath(),
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
        'Suite: ' + argv.s.join(', '),
        'Config: ' + argv.c,
        'Debug: ' + argv.d
    ]);
    Cli.log('');
    Cli.log('Other settings:')
    Cli.list([
        'Environment: ' + FlagpoleExecution.opts.environment,
        'Output: ' + FlagpoleExecution.opts.output.toString(),
        'Root Path: ' + Cli.config.getConfigFolder(),
        'Tests Path: ' + Cli.config.getTestsFolder()
    ]);
    Cli.log('');

}