export declare class FlagpoleConfig {
    configDir: string | undefined;
    testsPath: string | undefined;
    envBase: Array<{
        [s: string]: string;
    }>;
    isValid(): boolean;
}
export declare class TestSuiteFile {
    rootTestsDir: string;
    filePath: string;
    fileName: string;
    name: string;
    constructor(rootTestsDir: string, dir: string, file: string);
}
export declare class Tests {
    private testsFolder;
    private testSuiteStatus;
    private suites;
    constructor(testsFolder: string);
    private onTestStart(filePath);
    private onTestExit(filePath, exitCode);
    private getTestByName(name);
    private runTestFile(filePath);
    foundTestSuites(): boolean;
    getSuiteNames(): Array<string>;
    getTestsFolder(): string;
    runAll(): void;
    getAnyTestSuitesNotFound(suiteNames: Array<string>): string | null;
    filterTestSuitesByName(suiteNames: Array<string>): void;
}
export declare class Cli {
    static consoleLog: Array<string>;
    static log(message: string): void;
    static list(list: Array<string>): void;
    static exit(exitCode: number): void;
    static normalizePath(path: string): string;
    static parseConfigFile(configPath: string): FlagpoleConfig;
}
