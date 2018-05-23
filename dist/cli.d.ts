declare let argv: any;
declare let exec: any;
declare let fs: any;
declare class TestSuite {
    filePath: string;
    fileName: string;
    name: string;
    constructor(dir: string, file: string);
}
declare let getRootTestsFolder: () => string;
declare let tests: TestSuite[];
declare let run: (testFilePath: any) => void;
declare let getTestByName: (name: any) => TestSuite | undefined;
