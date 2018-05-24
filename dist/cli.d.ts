declare let argv: any;
declare let exec: any;
declare let fs: any;
declare class TestSuiteFile {
    filePath: string;
    fileName: string;
    name: string;
    constructor(dir: string, file: string);
}
declare let runTestFile: (filePath: string) => void;
declare let getTestByName: (name: string) => TestSuiteFile | undefined;
declare let tests: TestSuiteFile[];
