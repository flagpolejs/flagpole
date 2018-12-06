import { FlagpoleConfig, SuiteConfig } from "./config";
export declare function printHeader(): void;
export declare function printSubheader(heading: string): void;
export declare class TestRunner {
    private testSuiteStatus;
    private suites;
    constructor();
    private onTestStart(filePath);
    private onTestExit(filePath, exitCode);
    private runTestFile(filePath);
    addSuite(suite: SuiteConfig): void;
    reset(): void;
    getSuites(): SuiteConfig[];
    run(): void;
}
export declare class Cli {
    static consoleLog: Array<string>;
    static hideBanner: boolean;
    static rootPath: string;
    static configPath: string;
    static config: FlagpoleConfig;
    static command: string | null;
    static commandArg: string | null;
    static commandArg2: string | null;
    static apiDomain: string;
    static log(message: string): void;
    static list(list: Array<string>): void;
    static exit(exitCode: number): void;
    static normalizePath(path: string): string;
    static parseConfigFile(configPath: string): FlagpoleConfig;
    static getCredentials(): Promise<{
        email: string;
        token: string;
    }>;
}
