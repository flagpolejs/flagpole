import { Scenario } from "./scenario";
import { iResponse, SimplifiedResponse } from "./response";
import { Node } from "./node";
export interface iResponse {
    select(path: string, findIn?: any): Node;
    status(): Node;
    and(): Node;
    loadTime(): Node;
    headers(key?: string): Node;
    label(message: string): iResponse;
    setLastElement(path: string | null, element: Node): Node;
    getLastElement(): Node;
    getLastElementPath(): string | null;
    getRoot(): any;
    getBody(): string;
    comment(message: string): iResponse;
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
export declare abstract class GenericResponse implements iResponse {
    readonly scenario: Scenario;
    protected url: string;
    protected response: SimplifiedResponse;
    protected flipAssertion: boolean;
    protected ignoreAssertion: boolean;
    protected _lastElement: Node;
    protected _lastElementPath: string | null;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    abstract select(path: string, findIn?: any): Node;
    abstract getRoot(): any;
    getBody(): string;
    assert(statement: boolean, passMessage: any, failMessage: any): iResponse;
    protected reset(): iResponse;
    startIgnoringAssertions(): iResponse;
    stopIgnoringAssertions(): iResponse;
    not(): iResponse;
    setLastElement(path: string | null, element: Node): Node;
    getLastElement(): Node;
    getLastElementPath(): string | null;
    and(): Node;
    comment(message: string): iResponse;
    headers(key?: string): Node;
    status(): Node;
    loadTime(): Node;
    label(message: string): iResponse;
}
