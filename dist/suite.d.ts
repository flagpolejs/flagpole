import { Scenario } from "./scenario";
export declare class Suite {
    scenarios: Array<Scenario>;
    protected title: string;
    protected baseUrl: string | null;
    protected start: number;
    protected waitToExecute: boolean;
    protected byTag: any;
    protected usingConsoleOutput: boolean;
    protected callback: Function | null;
    constructor(title: string);
    setConsoleOutput(usingConsoleOutput: boolean): Suite;
    onDone(callback: Function): Suite;
    wait(bool?: boolean): Suite;
    isDone(): boolean;
    getDuration(): number;
    print(): Suite;
    toJson(): any;
    Scenario(title: string, tags?: [string]): Scenario;
    getScenarioByTag(tag: string): Scenario;
    getAllScenariosByTag(tag: string): [Scenario];
    base(url: string): Suite;
    buildUrl(path: string): string;
    execute(): Suite;
    passed(): boolean;
    failed(): boolean;
}
