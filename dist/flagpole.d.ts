import { Suite } from "./suite";
import { SimplifiedResponse } from "./response";
export declare enum FlagpoleOutput {
    console = 1,
    text = 2,
    json = 3,
    html = 4,
    csv = 5,
    tsv = 6,
    psv = 7,
}
export declare class Flagpole {
    static automaticallyPrintToConsole: boolean;
    static quietMode: boolean;
    static logOutput: boolean;
    protected static environment: string;
    protected static output: FlagpoleOutput;
    static setEnvironment(env: string): void;
    static getEnvironment(): string;
    static setOutput(output: FlagpoleOutput | string): void;
    static getOutput(): FlagpoleOutput;
    static Suite(title: string): Suite;
    static toSimplifiedResponse(response: any, body: any): SimplifiedResponse;
    static isNullOrUndefined(obj: any): boolean;
    static toType(obj: any): string;
}
