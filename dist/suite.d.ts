import { Scenario } from "./scenario";
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
    print(): Suite;
    Scenario(title: string, tags?: [string]): Scenario;
    getScenarioByTag(tag: string): Scenario;
    getAllScenariosByTag(tag: string): [Scenario];
    base(url: string): Suite;
    buildUrl(path: string): string;
    execute(): Suite;
    passed(): boolean;
    failed(): boolean;
}
