import { SuiteConfig } from './config';
import { Cli } from './cli';
import { Flagpole } from '..';
import { FlagpoleOutput } from '../flagpole';

const exec = require('child_process').exec;

export class SuiteExecution {

    public config: SuiteConfig;

    public get output(): string {
        return this._output.join(' ');
    }

    public get exitCode(): number | null {
        return this._exitCode;
    }

    protected _output: string[] = [];
    protected _exitCode: number | null = null;

    constructor(suiteConfig: SuiteConfig) {
        this.config = suiteConfig;
    }

    /**
     * Start running this suite
     * 
     * @param {string} filePath
     */
    public run(callback: Function) {
        const suite: SuiteExecution = this;
        const filePath: string = this.config.getPath();

        this._onBefore();

        let opts: string = '';
        if (Flagpole.getEnvironment()) {
            opts += ' -e ' + Flagpole.getEnvironment();
        }
        if (Flagpole.quietMode) {
            opts += ' -q';
        }
        if (Flagpole.logOutput) {
            opts += ' -l';
        }
        // Set Flagpole.exitOnDone.  This will typically only be set for tests run
        // through the cli.
        opts += ' -x';
        // Set the output to match what was typed at CLI
        opts += ' -o ' + Flagpole.output;

        // Run this command
        let child = exec('node ' + filePath + opts);
        // When it outputs to stdout
        child.stdout.on('data', function (data) {
            data && suite._output.push(data);
        });
        // When it outputs to stderr
        child.stderr.on('data', function (data) {
            data && suite._output.push(data);
        });
        // When it outputs errors
        child.on('error', function (data) {
            data && suite._output.push(data);
        });
        // When child process exists
        child.on('exit', function (exitCode: number) {
            if (exitCode > 0 && Flagpole.output == FlagpoleOutput.console) {
                suite._output.push('FAILED TEST SUITE:');
                suite._output.push(filePath + ' exited with error code ' + exitCode);
                suite._output.push("\n");
            }
            suite._onAfter(exitCode);
            callback(suite);
        });
    }

    protected _reset() {
        this._output = [];
        this._exitCode = null;
    }

    protected _onBefore() {
        this._reset();
    }

    protected _onAfter(exitCode: number) {
        this._exitCode = exitCode;
    }

}

export class TestRunner {

    private suites: { [s: string]: SuiteExecution; } = {};
    private _timeStart: number = Date.now();

    /**
     * Add a suite to the list of ones we are running
     * @param suite 
     */
    public addSuite(suiteConfig: SuiteConfig) {
        if (!this.suites[suiteConfig.name]) {
            this.suites[suiteConfig.name] = new SuiteExecution(suiteConfig);
        }
    }

    /**
     * Clear all suites
     */
    public reset() {
        this.suites = {};
    }

    /**
     * Get list of the suites we are running
     */
    public getSuites(): SuiteExecution[] {
        const suiteNames: string[] = Object.keys(this.suites);
        let suites: SuiteExecution[] = [];
        suiteNames.forEach((suiteName) => {
            suites.push(this.suites[suiteName]);
        });
        return suites;
    }

    /**
     * Start running suites
     */
    public run() {
        const suites: SuiteExecution[] = this.getSuites();
        // Run them
        suites.forEach((suite: SuiteExecution) => {
            suite.run((suite: SuiteExecution) => {
                this._onTestExit(suite);
            });
        });
    }

    private _onDone() {
        const areAllPassing: boolean = Object.keys(this.suites).every((key: string) => {
            return (this.suites[key].exitCode === 0);
        });
        const suites = this.getSuites();
        const duration: number = Date.now() - this._timeStart;
        let output: string = '';
        if (Flagpole.output == FlagpoleOutput.json) {
            let suiteOutput: string[] = [];
            let overall = {
                pass: 0,
                fail: 0
            };
            suites.forEach((suite: SuiteExecution) => {
                //output += `{ "properties: { "name":"${suite.config.name}"}, "scenarios:" [ ${suite.output} ]}`;
                suiteOutput.push(suite.output);
                if (suite.exitCode == 0) {
                    overall.pass += 1;
                }
                else {
                    overall.fail += 1;
                }
            });
            output = `{ "summary": { "passCount": ${overall.pass}, "failCount": ${overall.fail}, "duration": ${duration} }, ` +
                `"suites": [${ suiteOutput.join(',') }] }`;
        }
        else {
            suites.forEach((suite: SuiteExecution) => {
                output += suite.output + "\n";
            });
        }
        if (Flagpole.output == FlagpoleOutput.browser) {
            const open = require('open');
            const fs = require('fs');
            const tmp = require('tmp');
            const tmpObj = tmp.fileSync({ postfix: '.html' });
            const filePath: string = tmpObj.name;
            let template: string = fs.readFileSync(`${__dirname}/report.html`, 'utf8');
            template = template.replace('${output}', output);
            fs.writeFileSync(filePath, template);
            Cli.log(`Writing output to: ${filePath}`);
            (async () => {
                await open(filePath);
                Cli.exit(areAllPassing ? 0 : 1);
            })();
        }
        else {
            Cli.log(output);
            if (!areAllPassing && Flagpole.output == FlagpoleOutput.console) {
                Cli.log('Some suites failed.');
            }
            Cli.exit(areAllPassing ? 0 : 1);
        }    
    }

    /**
    * When each suite finishes
    * 
    * @param filePath 
    * @param exitCode 
    */
    private _onTestExit(suite: SuiteExecution) {
        if (Object.keys(this.suites).every((key: string) => {
            return this.suites[key].exitCode !== null;
        })) {
            this._onDone();
        }
    };


}
