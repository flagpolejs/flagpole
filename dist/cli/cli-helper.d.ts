export declare function printHeader(): void;
export declare function printSubheader(heading: string): void;
export declare class FlagpoleConfig {
    configPath: string;
    configDir: string;
    testsPath: string | undefined;
    env: string[];
    projectName: string;
    testFolderName: string;
    constructor(configData?: any);
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
    static hideBanner: boolean;
    static rootPath: string;
    static configPath: string;
    static config: FlagpoleConfig;
    static testsPath: string;
    static environment: string;
    static command: string | null;
    static commandArg: string | null;
    static log(message: string): void;
    static list(list: Array<string>): void;
    static exit(exitCode: number): void;
    static normalizePath(path: string): string;
    static parseConfigFile(configPath: string): FlagpoleConfig;
}
