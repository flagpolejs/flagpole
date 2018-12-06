/// <reference types="node" />
import { Scenario } from "./scenario";
import { iLogLine } from "./consoleline";
import { URL } from 'url';
export declare class Suite {
    scenarios: Array<Scenario>;
    protected title: string;
    protected baseUrl: URL | null;
    protected start: number;
    protected waitToExecute: boolean;
    protected callback: Function | null;
    protected _verifySslCert: boolean;
    constructor(title: string);
    verifySslCert(verify: boolean): Suite;
    onDone(callback: Function): Suite;
    wait(bool?: boolean): Suite;
    isDone(): boolean;
    getDuration(): number;
    print(): Suite;
    getLines(): iLogLine[];
    toConsoleString(): string;
    toString(): string;
    toJson(): any;
    toHTML(): string;
    getTitle(): string;
    Scenario(title: string): Scenario;
    Json(title: string): Scenario;
    Image(title: string): Scenario;
    Html(title: string): Scenario;
    Stylesheet(title: string): Scenario;
    Script(title: string): Scenario;
    Resource(title: string): Scenario;
    base(url: string | any[]): Suite;
    buildUrl(path: string): string;
    execute(): Suite;
    passed(): boolean;
    failed(): boolean;
}
