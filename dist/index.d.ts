import { Suite } from "./suite";
import { Scenario } from "./scenario";
import { Element, Value } from "./property";
export interface iResponse {
    select(path: string, findIn?: any): Element;
    status(): Value;
    and(): Element;
    label(message: string): iResponse;
    lastElement(property?: Element): Element;
    comment(message: string): iResponse;
    headers(key?: string): Value;
    not(): iResponse;
    startIgnoringAssertions(): iResponse;
    stopIgnoringAssertions(): iResponse;
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse;
    readonly scenario: Scenario;
}
export interface SimplifiedResponse {
    statusCode: number;
    body: string;
    headers: Array<any>;
}
export declare class Flagpole {
    static Suite(title: string): Suite;
    static heading(message: string): void;
    static message(message: string, color?: string): void;
    static toSimplifiedResponse(response: any, body: any): SimplifiedResponse;
    static isNullOrUndefined(obj: any): boolean;
    static toType(obj: any): string;
}
