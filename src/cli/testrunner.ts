import { SuiteConfig } from './config';
import { Cli } from './cli';
import { FlagpoleOutput, FlagpoleExecution  } from '../flagpoleexecutionoptions';
import { SuiteExecution, SuiteExecutionResult, SuiteExecutionInline } from './suiteexecution';

export class TestRunner {

    private _suiteConfigs: { [s: string]: SuiteConfig; } = {};
    private _executionResults: SuiteExecutionResult[] = [];
    private _timeStart: number = Date.now();
    private _subscribers: Function[] = [];

    public get suites(): SuiteConfig[] {
        let arr: SuiteConfig[] = [];
        Object.keys(this._suiteConfigs).forEach(suiteName => {
            arr.push(this._suiteConfigs[suiteName]);
        });
        return arr;
    }

    public get results(): SuiteExecutionResult[] {
        return this._executionResults;
    }

    public get exitCode(): number {
        let exitCode: number = 0;
        this._executionResults.forEach(result => {
            exitCode = (result.exitCode > exitCode) ? result.exitCode : exitCode;
        });
        return exitCode
    }

    public get allPassing(): boolean {
        return this._executionResults.every(result => {
            return result.exitCode == 0;
        });
    }

    public subscribe(callback: Function) {
        this._subscribers.push(callback);
    }

    /**
     * Add a suite to the list of ones we are running
     * @param suite 
     */
    public addSuite(suiteConfig: SuiteConfig) {
        this._suiteConfigs[suiteConfig.name] = suiteConfig;
    }

    /**
     * Start running suites
     */
    public async run(): Promise<SuiteExecutionResult[]> {
        this._executionResults = [];
        // Loop through each suite and run it
        const totalSuites = Object.keys(this._suiteConfigs).length;
        let count: number = 1;
        for (let suiteName in this._suiteConfigs) {
            this._publish(`Running suite ${suiteName} (${count} of ${totalSuites})...`);
            let execution: SuiteExecution = SuiteExecutionInline.executeSuite(this._suiteConfigs[suiteName]);
            this._executionResults.push(await execution.result);
            count++;
        }
        this._onDone();
        return this._executionResults;
    }

    public async runSpawn(): Promise<SuiteExecutionResult[]> {
        this._executionResults = [];
        // Loop through each suite and run it
        const totalSuites = Object.keys(this._suiteConfigs).length;
        let count: number = 1;
        for (let suiteName in this._suiteConfigs) {
            this._publish(`Running suite ${suiteName} (${count} of ${totalSuites})...`);
            let execution: SuiteExecution = SuiteExecution.executeSuite(this._suiteConfigs[suiteName]);
            this._executionResults.push(await execution.result);
            count++;
        }
        this._onDone();
        return this._executionResults;
    }

    private _onDone() {
        const duration: number = Date.now() - this._timeStart;
        let output: string = '';
        if (FlagpoleExecution.opts.output == FlagpoleOutput.json) {
            let suiteOutput: string[] = [];
            let overall = {
                pass: 0,
                fail: 0
            };
            this._executionResults.forEach(result => {
                suiteOutput.push(result.toString());
                if (result.exitCode == 0) {
                    overall.pass += 1;
                }
                else {
                    overall.fail += 1;
                }
            });
            output = `
                { 
                    "summary": {
                        "passCount": ${overall.pass}, 
                        "failCount": ${overall.fail}, 
                        "duration": ${duration} 
                    }, ` +
                    `"suites": [
                        ${suiteOutput.join(',')}
                    ]
                }
            `;
        }
        else {
            this._executionResults.forEach(result => {
                output += result.toString() + "\n";
            });
        }
        if (FlagpoleExecution.opts.output == FlagpoleOutput.browser) {
            const open = require('open');
            const fs = require('fs');
            const tmp = require('tmp');
            const tmpObj = tmp.fileSync({ postfix: '.html' });
            const filePath: string = tmpObj.name;
            let template: string = fs.readFileSync(`${__dirname}/report.html`, 'utf8');
            template = template.replace('${output}', output).replace('${nav}', '');
            fs.writeFileSync(filePath, template);
            Cli.log(`Writing output to: ${filePath}`);
            (async () => {
                await open(filePath);
                Cli.exit(this.allPassing ? 0 : 1);
            })();
        }
        else {
            Cli.log(output);
            if (!this.allPassing && FlagpoleExecution.opts.output == FlagpoleOutput.console) {
                Cli.log('Some suites failed.');
            }
        }    
    }

    public toString(): string {
        let output: string = '';
        this._executionResults.forEach(result => {
            output += result.toString() + "\n";
        });
        return output;
    }

    protected _publish(message: string) {
        this._subscribers.forEach(callback => {
            callback.apply(this, [message]);
        });
    }

}
