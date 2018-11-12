import { Scenario } from "./scenario";
import { iResponse } from "./response";
export interface iProperty {
    toString(): string;
    get(): any;
    not(): iResponse;
    label(message: string): iResponse;
    comment(message: string): iResponse;
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse;
    exists(): iResponse;
    is(type: string): iResponse;
    contains(string: string): iResponse;
    matches(pattern: RegExp): iResponse;
    startsWith(matchText: string): iResponse;
    endsWith(matchText: string): iResponse;
    equals(value: any, permissiveMatching: boolean): iResponse;
    similarTo(value: any): iResponse;
}
export declare abstract class Property implements iProperty {
    protected response: iResponse;
    protected name: string;
    protected obj: any;
    constructor(response: iResponse, name: string, obj: any);
    not(): iResponse;
    toString(): string;
    get(): any;
    protected pass(message: string): Scenario;
    protected fail(message: string): Scenario;
    comment(message: string): iResponse;
    label(message: string): iResponse;
    echo(): iProperty;
    typeof(): iProperty;
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse;
    contains(string: string): iResponse;
    matches(pattern: RegExp): iResponse;
    startsWith(matchText: string): iResponse;
    endsWith(matchText: string): iResponse;
    is(type: string): iResponse;
    exists(): iResponse;
    headers(key?: string): iProperty;
    equals(value: any, permissiveMatching?: boolean): iResponse;
    similarTo(value: any): iResponse;
}
