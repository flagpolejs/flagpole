"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TestSuiteFile {
    constructor(rootTestsDir, dir, file) {
        this.rootTestsDir = '';
        this.filePath = '';
        this.fileName = '';
        this.name = '';
        this.rootTestsDir = rootTestsDir;
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(this.rootTestsDir, '') + file.split('.').slice(0, -1).join('.');
    }
}
exports.TestSuiteFile = TestSuiteFile;
