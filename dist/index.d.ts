export interface SimplifiedResponse {
    statusCode: number;
    body: string;
    headers: Array<any>;
}
export declare class Suite {
    scenarios: Array<Scenario>;
    protected title: string;
    protected baseUrl: string | null;
    protected start: number;
    protected waitToExecute: boolean;
    protected byTag: any;
    constructor(title: string);
    wait(bool?: boolean): Suite;
    isDone(): boolean;
    getDuration(): number;
    print(): void;
    Scenario(title: string, tags?: [string]): Scenario;
    getScenarioByTag(tag: string): Scenario;
    getAllScenariosByTag(tag: string): [Scenario];
    base(url: string): Suite;
    buildUrl(path: string): string;
    execute(): Suite;
    passed(): boolean;
    failed(): boolean;
}
export declare class Scenario {
    readonly suite: Suite;
    protected title: string;
    protected log: Array<ConsoleLine>;
    protected failures: Array<string>;
    protected passes: Array<string>;
    protected onDone: Function;
    protected initialized: number | null;
    protected start: number | null;
    protected end: number | null;
    protected pageType: string;
    protected then: Function | null;
    protected url: string | null;
    protected waitToExecute: boolean;
    protected nextLabel: string | null;
    protected options: any;
    constructor(suite: Suite, title: string, onDone: Function);
    failed(): boolean;
    passed(): boolean;
    timeout(timeout: number): Scenario;
    wait(bool?: boolean): Scenario;
    form(form: any): Scenario;
    auth(authorization: any): Scenario;
    headers(headers: any): Scenario;
    type(type: string): Scenario;
    method(method: string): Scenario;
    isDone(): boolean;
    subheading(message: string): Scenario;
    pass(message: string): Scenario;
    fail(message: string): Scenario;
    open(url: string): Scenario;
    assertions(then: Function): Scenario;
    skip(): Scenario;
    execute(): Scenario;
    Scenario(title: string, tags?: [string]): Scenario;
    label(message: string): Scenario;
    getLog(): Array<ConsoleLine>;
    protected getExecutionTime(): number;
    done(): Scenario;
}
export declare class ConsoleLine {
    color: string;
    message: string;
    constructor(message: string, color?: string);
    write(): void;
}
export declare class Flagpole {
    static Suite(title: string): Suite;
    static heading(message: string): void;
    static message(message: string, color?: string): void;
    static toSimplifiedResponse(response: any, body: any): SimplifiedResponse;
    static isNullOrUndefined(obj: any): boolean;
    static toType(obj: any): string;
}
