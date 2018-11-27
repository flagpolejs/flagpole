import { Scenario } from "./scenario";
import { iResponse, SimplifiedResponse } from "./response";
import { Node } from "./node";
export interface iResponse {
    getType(): ResponseType;
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
    getUrl(): string;
    comment(message: string): iResponse;
    not(): iResponse;
    optional(): iResponse;
    ignore(assertions?: boolean | Function): iResponse;
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse;
    absolutizeUri(uri: string): string;
    readonly scenario: Scenario;
}
export declare enum ResponseType {
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
    headers: any;
}
export declare abstract class GenericResponse implements iResponse {
    readonly scenario: Scenario;
    private _url;
    private _statusCode;
    private _body;
    private _headers;
    private _lastElement;
    private _lastElementPath;
    abstract getType(): ResponseType;
    abstract select(path: string, findIn?: any): Node;
    constructor(scenario: Scenario, url: string, simplifiedResponse: SimplifiedResponse);
    absolutizeUri(uri: string): string;
    getUrl(): string;
    getBody(): string;
    getRoot(): any;
    assert(statement: boolean, passMessage: any, failMessage: any): iResponse;
    not(): iResponse;
    optional(): iResponse;
    ignore(assertions?: boolean | Function): iResponse;
    label(message: string): iResponse;
    comment(message: string): iResponse;
    setLastElement(path: string | null, element: Node): Node;
    getLastElement(): Node;
    getLastElementPath(): string | null;
    and(): Node;
    headers(key?: string): Node;
    status(): Node;
    length(): Node;
    loadTime(): Node;
    url(): Node;
    path(): Node;
}
