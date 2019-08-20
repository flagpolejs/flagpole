
export enum FlagpoleOutput {
    console = 1,
    text = 2,
    json = 3,
    html = 4,
    csv = 5,
    tsv = 6,
    psv = 7,
    browser = 8
}

export class FlagpoleExecutionOptions {

    /**
     * There always has to be an environment, default to dev
     */
    public environment: string = 'dev';

    /**
     * Do not write out any output
     */
    public quietMode: boolean = false;

    /**
     * If true will automatically print out test results to the console
     */
    public automaticallyPrintToConsole: boolean = false;

    /**
     * This indicates we are printing log style output where we should ignore any decorative stuff
     */
    public logMode: boolean = false;

    /**
     * Once execution of a suite completes, exit the process
     */
    public exitOnDone: boolean = false;

    /**
     * If there is output, what format shoudl it be in?
     */
    public output: FlagpoleOutput = FlagpoleOutput.console;

    /**
     * Create a blank instance
     */
    public static create(): FlagpoleExecutionOptions {
        return new FlagpoleExecutionOptions();
    }

    /**
     * Parse argument string to create an instance
     * 
     * @param args 
     */
    public static createFromString(args: string): FlagpoleExecutionOptions {
        return FlagpoleExecutionOptions.createWithArgs(args.split(' '));
    }

    /**
     * Parse string argument array to create an instance
     * 
     * @param args 
     */
    public static createWithArgs(args: string[]): FlagpoleExecutionOptions {
        const opts = new FlagpoleExecutionOptions();
        let lastArg: string | null = null;
        let env: string | null = null;
        args.forEach(function (arg: string) {
            if (lastArg == '-e') {
                env = arg;
                opts.environment = env;
            }
            else if (lastArg == '-o') {
                opts.setOutputFromString(arg);
                opts.automaticallyPrintToConsole = true;
            }
            else if (arg == '-q') {
                opts.quietMode = true;
                lastArg = null;
                return;
            }
            else if (arg == '-l') {
                opts.logMode = true;
                lastArg = null;
                return;
            }
            else if (arg == '-x') {
                opts.exitOnDone = true;
                lastArg = null;
                return;
            }
            lastArg = arg;
        });
        return opts;
    }

    /**
     * Don't let this be constructed from outside, only use create static methods
     */
    private constructor() {}

    /**
     * Set the output value from a string, translate it to our enum
     * 
     * @param value 
     */
    public setOutputFromString(value: string) {
        if (typeof value == 'string') {
            if (Object.keys(FlagpoleOutput).includes(value)) {
                if (parseInt(value) > 0) {
                    this.output = <FlagpoleOutput>parseInt(value);
                }
                else {
                    this.output = FlagpoleOutput[value];
                }
            }
        }
    }

    public getOutputAsString(): string {
        let out: string = 'console';
        Object.keys(FlagpoleOutput).some(key => {
            if (FlagpoleOutput[key] == this.output) {
                out = key;
                return true;
            }
            return false;
        });
        return out;
    }

    /**
     * Turn this back into an execution string to use at command line
     */
    public toString(): string {
        let opts: string = '';
        if (this.environment !== null) {
            opts += ' -e ' + this.environment;
        }
        if (this.quietMode) {
            opts += ' -q';
        }
        if (this.logMode) {
            opts += ' -l';
        }
        if (this.exitOnDone) {
            opts += ' -x';
        }
        if (this.output !== null) {
            opts += ' -o ' + this.getOutputAsString();
        }
        return opts;
    }

    public toArgs(): string[] {
        const str = this.toString().trim();
        return str.split(' ');
    }

}