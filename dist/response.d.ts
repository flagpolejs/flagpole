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
    absolutizeUri(uri: string): string;
    readonly scenario: Scenario;
}
export declare enum ReponseType {
    html = 0,
    json = 1,
    image = 2,
    stylesheet = 3,
    script = 4,
    resource = 5,
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
    absolutizeUri(uri: string): string;
    getBody(): string;
    getRoot(): any;
    select(path: string, findIn?: any): Node;
    assert(statement: boolean, passMessage: any, failMessage: any): iResponse;
    protected reset(): iResponse;
    startIgnoringAssertions(): iResponse;
    stopIgnoringAssertions(): iResponse;
    not(): iResponse;
    label(message: string): iResponse;
    comment(message: string): iResponse;
    setLastElement(path: string | null, element: Node): Node;
    getLastElement(): Node;
    getLastElementPath(): string | null;
    and(): Node;
    headers(key?: string): Node;
    status(): Node;
    loadTime(): Node;
}
