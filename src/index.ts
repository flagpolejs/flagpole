import { ConsoleLine, LogType } from "./consoleline";
import { Suite } from "./suite";
import { Scenario } from "./scenario";
import { Element, Value } from "./property";

let cheerio = require('cheerio');

export interface iResponse {
    select(path: string, findIn?: any): Element
    status(): Value
    and(): Element
    label(message: string): iResponse
    lastElement(property?: Element): Element
    comment(message: string): iResponse
    headers(key?: string): Value
    not(): iResponse
    startIgnoringAssertions(): iResponse
    stopIgnoringAssertions(): iResponse
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse
    readonly scenario: Scenario
}

export interface SimplifiedResponse {
    statusCode: number
    body: string
    headers: Array<any>
}

export class Flagpole {

    /**
     * Create a new suite
     *
     * @param {string} title
     * @returns {Suite}
     * @constructor
     */
    static Suite(title: string): Suite {
        let suite: Suite = new Suite(title);
        if (typeof process.env.FLAGPOLE_BASE_DOMAIN !== 'undefined') {
            suite.base(String(process.env.FLAGPOLE_BASE_DOMAIN));
        }
        return suite;
    }

    /**
     * Write a big heading like what might go over top of the suite
     *
     * @param {string} message
     */
    static heading(message: string) {
        let length: number = Math.max(message.length + 10, 50),
            padding: number = (length - message.length) / 2;
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
        new ConsoleLine(' '.repeat(padding) + message.toLocaleUpperCase() + ' '.repeat(padding), "\x1b[33m").write();
        new ConsoleLine('='.repeat(length), "\x1b[33m").write();
    }

    /**
     * Write something to console right away
     *
     * @param {string} message
     * @param {string} color
     */
    static message(message: string, color?: string) {
        new ConsoleLine(message, color).write();
    }

    /**
     * Convert the full response object into just the essentials
     *
     * @param response
     * @param body
     * @returns {SimplifiedResponse}
     */
    static toSimplifiedResponse(response, body): SimplifiedResponse {
        return {
            statusCode: response.statusCode,
            body: body,
            headers: response.headers,
        };
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
        if (typeof obj === "undefined") {
            return 'undefined';
        }
        else if (obj === null) {
            return 'null';
        }
        else if (obj instanceof cheerio) {
            return 'cheerio';
        }
        else if (obj && obj.constructor && obj.constructor.name) {
            return obj.constructor.name.toLocaleLowerCase();
        }
        else if (obj && obj.constructor && obj.constructor.toString) {
            let arr = obj.constructor.toString().match(/function\s*(\w+)/);
            if (arr && arr.length == 2) {
                return arr[1].toLocaleLowerCase();
            }
        }
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLocaleLowerCase();
    }

}

