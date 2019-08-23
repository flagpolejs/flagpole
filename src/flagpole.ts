import { FlagpoleExecutionOptions } from '.';
import { Suite } from './suite';

const cheerio = require('cheerio');

export class Flagpole {

    public static executionOpts = FlagpoleExecutionOptions.create();
    public static suites: Suite[] = [];

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
        Flagpole.suites.push(suite);
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

    public static uniqueId(): string {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    public static async openInBrowser(content: string): Promise<string> {
        const open = require('open');
        const fs = require('fs');
        const tmp = require('tmp');
        const tmpObj = tmp.fileSync({ postfix: '.html' });
        const filePath: string = tmpObj.name;
        console.log(filePath);
        fs.writeFileSync(filePath, content);
        await open(filePath);
        return filePath;
    }

    public static async forEach(array: any[], callback: Function) {
        for (let i = 0; i < array.length; i++) {
            await callback(array[i], i, array);
        }
    }

}
