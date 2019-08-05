import { Suite } from "./suite";

const cheerio = require('cheerio');

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

export class Flagpole {

    public static automaticallyPrintToConsole: boolean = false;
    public static quietMode: boolean = false;

    /**
     * This indicates we are printing log style output where we should ignore any decorative stuff
     */
    public static logOutput: boolean = false;

    protected static _output: FlagpoleOutput = FlagpoleOutput.console;
    protected static environment: string = 'dev';
    public static exitOnDone: boolean = false;

    public static get output(): FlagpoleOutput {
        return this._output;
    }

    public static setEnvironment(env: string) {
        Flagpole.environment = env;
    }

    public static getEnvironment(): string {
        return Flagpole.environment;
    }

    public static setOutput(output: FlagpoleOutput | string) {
        if (typeof output == 'string') {
            if (Object.keys(FlagpoleOutput).includes(output)) {
                if (parseInt(output) > 0) {
                    Flagpole._output = <FlagpoleOutput> parseInt(output);
                }
                else {
                    Flagpole._output = FlagpoleOutput[output];
                }
            }
        }
    }

    static exit(passed: boolean) {
        process.exit(passed ? 0 : 1);
    }

    /**
     * Create a new suite
     *
     * @param {string} title
     * @returns {Suite}
     * @constructor
     */
    static suite = Flagpole.Suite;
    static Suite(title: string): Suite {
        let suite: Suite = new Suite(title);
        return suite;
    }

    /**
     * Ist his object null or undefined?
     *
     * @param obj
     * @returns {boolean}
     */
    static isNullOrUndefined(obj: any): boolean {
        return (typeof obj === "undefined" || obj === null);
    }

    /**
     * Get the real and normalized type of object
     *
     * @param obj
     * @returns {string}
     */
    static toType(obj: any): string {
        if (typeof obj === 'undefined') {
            return 'undefined';
        }
        else if (obj === null) {
            return 'null';
        }
        else if (obj === NaN) {
            return 'nan';
        }
        else if (obj instanceof cheerio) {
            return 'cheerio';
        }
        else if (!!obj &&
            (typeof obj === 'object' || typeof obj === 'function') &&
            typeof obj.then === 'function' &&
            typeof obj.catch === 'function'
        ) {
            return 'promise';
        }
        else if (obj && obj.constructor && obj.constructor.name) {
            return String(obj.constructor.name).toLocaleLowerCase();
        }
        else if (obj && obj.constructor && obj.constructor.toString) {
            let arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return String(arr[1]).toLocaleLowerCase();
            }
        }
        // This confusing mess gets deep typeof
        const match: RegExpMatchArray | null = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/);
        return match !== null ? String(match[1]).toLocaleLowerCase() : '';
    }

}
