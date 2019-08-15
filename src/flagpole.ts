
import { Assertion } from "./assertion";
import { AssertionContext } from "./assertioncontext";
import { AssertionResult } from "./assertionresult";
import { Browser, BrowserOptions } from "./browser";
import { BrowserResponse } from "./browserresponse";
import { CssResponse } from "./cssresponse";
import { DOMElement } from "./domelement";
import { ExtJSResponse } from "./extjsresponse";
import { HtmlResponse } from "./htmlresponse";
import { ImageResponse } from "./imageresponse";
import { jPath, iJPath } from "./jpath";
import { JsonResponse } from "./jsonresponse";
import { ResourceResponse } from "./resourceresponse";
import { ResponseType, GenericResponse, NormalizedResponse } from "./response";
import { Scenario } from "./scenario";
import { ScriptResponse } from "./scriptresponse";
import { Suite } from "./suite";
import { Value, iValue } from "./value";
import { VideoResponse } from "./videoresponse";

const cheerio = require('cheerio');

export {
    Suite, Scenario,
    Browser, BrowserOptions, BrowserResponse, CssResponse, DOMElement, ExtJSResponse,
    HtmlResponse, ImageResponse, JsonResponse, ResourceResponse,
    ResponseType, GenericResponse, NormalizedResponse,
    ScriptResponse, iValue, Value, VideoResponse,
    jPath, iJPath
};

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

}
