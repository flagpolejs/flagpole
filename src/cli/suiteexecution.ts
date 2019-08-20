import { SuiteConfig } from './config';
import { Flagpole, FlagpoleExecutionOptions, FlagpoleOutput } from '..';
import { spawn } from 'child_process';

/**
 * Immutable result of an execution
 */
export class SuiteExecutionResult {

    public get output(): string[] {
        return this._output;
    }

    public get exitCode(): number {
        return this._exitCode;
    }

    protected _output: string[];
    protected _exitCode: number;

    constructor(output: string[], exitCode: number) {
        this._output = output;
        this._exitCode = exitCode;
    }

    public toString(): string {
        return this._output.join("\n");
    }

}

export class SuiteExecution {

    protected _result: SuiteExecutionResult | null = null;
    protected _started: number | null = null;
    protected _finished: number | null = null;
    protected _subscribers: Function[] = [];
    protected _finally: Function[] = [];
    protected _output: string[] = [];

    public get exitCode(): number | null {
        return this._result === null ? null : this._result.exitCode;
    }

    public get output(): string[] {
        return this._output;
    }

    public static executePath(filePath: string, opts: FlagpoleExecutionOptions): Promise<SuiteExecutionResult> {
        const execution: SuiteExecution = new SuiteExecution();
        return execution.executePath(filePath, opts);
    }

    public static executeSuite(config: SuiteConfig): Promise<SuiteExecutionResult> {
        const execution: SuiteExecution = new SuiteExecution();
        return execution.executeSuite(config);
    }

    public subscribe(callback: (output: string, execution: SuiteExecution) => void) {
        this._subscribers.push(callback);
    }

    public finally(callback: (execution: SuiteExecution) => void) {
        this._finally.push(callback);
    }

    public toString(): string {
        return this._output.join("\n");
    }

    public async executePath(filePath: string, opts: FlagpoleExecutionOptions): Promise<SuiteExecutionResult> {
        if (this._result !== null || this._started !== null) {
            throw new Error(`This execution has already run.`);
        }
        this._started = Date.now();
        this._result = await this._execute(filePath, Flagpole.executionOpts);
        this._finished = Date.now();
        this._finally.forEach((callback: Function) => {
            callback.apply(this, [this]);
        });
        return this._result;
    }

    /**
     * Start running this suite
     * 
     * @param {string} filePath
     */
    public async executeSuite(config: SuiteConfig): Promise<SuiteExecutionResult> {
        return this.executePath(
            config.getPath(),
            Flagpole.executionOpts
        );
    }

    protected _execute(filePath: string, opts: FlagpoleExecutionOptions): Promise<SuiteExecutionResult> {
        this._output = [];
        return new Promise((resolve) => {
            const process = spawn('node', [filePath].concat(opts.toArgs()));
            process.stdout.on('data', (data) => {
                this._logLine(data);
            });
            process.stderr.on('data', (data) => {
                this._logLine(data);
            });
            process.on('close', (exitCode) => {
                if (exitCode > 0 && opts.output == FlagpoleOutput.console) {
                    this._logLine('FAILED TEST SUITE:');
                    this._logLine(filePath + ' exited with error code ' + exitCode);
                    this._logLine("\n");
                }
                resolve(new SuiteExecutionResult(this._output, exitCode));
            });
        });
    }

    protected _logLine(data: string | Buffer) {
        if (data) {
            const line: string = String(data).trim();
            this._output.push(line);
            this._subscribers.forEach((callback: Function) => {
                callback.apply(this, [line, this]);
            });
        }
    }

}