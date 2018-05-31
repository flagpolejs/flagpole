declare let exec: any;
declare let fs: any;
declare let yargs: any;
declare let argv: any;
declare function printHeader(): void;
declare let testSuiteStatus: {
    [s: string]: number | null;
};
declare let onTestStart: (filePath: string) => void;
declare let onTestExit: (filePath: string, exitCode: number) => void;
declare let consoleLog: Array<string>;
declare let log: (message: string) => void;
declare let exit: (exitCode: number) => void;
declare class TestSuiteFile {
    filePath: string;
    fileName: string;
    name: string;
    constructor(dir: string, file: string);
}
declare let runTestFile: (filePath: string) => void;
declare let getTestByName: (name: string) => TestSuiteFile | undefined;
declare let tests: TestSuiteFile[];
