#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');
process.env.ENVIRONMENT = argv.env || 'prod';
process.env.SUITE = argv.suite || null;
process.env.GROUP = argv.group || null;
process.env.ROOT_FOLDER = (function () {
    let rootFolder = argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
    if (argv.root) {
        rootFolder = argv.root;
        rootFolder = (rootFolder.match(/\/$/) ? rootFolder : rootFolder + '/') + 'tests/';
    }
    return rootFolder;
})();
class TestSuiteFile {
    constructor(dir, file) {
        this.filePath = '';
        this.fileName = '';
        this.name = '';
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(String(process.env.ROOT_FOLDER), '') + file.split('.').slice(0, -1).join('.');
    }
}
let runTestFile = function (filePath) {
    exec('node ' + filePath, function (err, stdout, stderr) {
        if (err) {
            return;
        }
        console.log(`${stdout}`);
        console.log(`${stderr}`);
    });
};
let getTestByName = function (name) {
    for (let i = 0; i < tests.length; i++) {
        if (tests[i].name == name) {
            return tests[i];
        }
    }
};
let tests = (function () {
    let tests = [];
    let findTests = function (dir) {
        if (fs.existsSync(dir)) {
            let files = fs.readdirSync(dir);
            files.forEach(function (file) {
                if (fs.statSync(dir + file).isDirectory()) {
                    tests = findTests(dir + file + '/');
                }
                else if (file.match(/.js$/)) {
                    tests.push(new TestSuiteFile(dir, file));
                }
            });
        }
        return tests;
    };
    return findTests(process.env.ROOT_FOLDER);
})();
console.log("\x1b[32m", "\n", `\x1b[31m$$$$$$$$\\ $$\\                                         $$\\           
\x1b[31m $$  _____|$$ |                                        $$ |          
\x1b[31m $$ |      $$ | $$$$$$\\   $$$$$$\\   $$$$$$\\   $$$$$$\\  $$ | $$$$$$\\  
\x1b[31m $$$$$\\    $$ | \\____$$\\ $$  __$$\\ $$  __$$\\ $$  __$$\\ $$ |$$  __$$\\ 
\x1b[37m $$  __|   $$ | $$$$$$$ |$$ /  $$ |$$ /  $$ |$$ /  $$ |$$ |$$$$$$$$ |
\x1b[37m $$ |      $$ |$$  __$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|
\x1b[37m $$ |      $$ |\\$$$$$$$ |\\$$$$$$$ |$$$$$$$  |\\$$$$$$  |$$ |\\$$$$$$$\\ 
\x1b[34m \\__|      \\__| \\_______| \\____$$ |$$  ____/  \\______/ \\__| \\_______|
\x1b[34m                         $$\\   $$ |$$ |                              
\x1b[34m                         \\$$$$$$  |$$ |                              
\x1b[34m                          \\______/ \\__|`, "\x1b[0m", "\n");
if (argv.list) {
    console.log('Looking in folder: ' + process.env.ROOT_FOLDER + "\n");
    if (tests.length > 0) {
        console.log('Found these test suites:');
        tests.forEach(function (test) {
            console.log('  » ' + test.name);
        });
        console.log("\n");
    }
    else {
        console.log("Did not find any tests.\n");
    }
}
else if (argv.suite) {
    let test = getTestByName(argv.suite);
    test ?
        runTestFile(test.filePath) :
        console.log('Could not find test suite: ' + argv.suite + "\n");
}
else if (argv.all) {
    tests.forEach(function (test) {
        runTestFile(test.filePath);
    });
}
