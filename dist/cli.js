#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');
class TestSuite {
    constructor(dir, file) {
        this.filePath = '';
        this.fileName = '';
        this.name = '';
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(process.cwd() + '/tests/', '') + file.split('.').slice(0, -1).join('.');
    }
}
let getRootTestsFolder = function () {
    return argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
};
let tests = (function (startDirectory) {
    let tests = [];
    let findTests = function (dir) {
        if (fs.existsSync(dir)) {
            let files = fs.readdirSync(dir);
            files.forEach(function (file) {
                if (fs.statSync(dir + file).isDirectory()) {
                    tests = findTests(dir + file + '/');
                }
                else if (file.match(/.js$/)) {
                    tests.push(new TestSuite(dir, file));
                }
            });
        }
        return tests;
    };
    return findTests(startDirectory);
})(getRootTestsFolder());
let run = function (testFilePath) {
    exec('node ' + testFilePath, function (err, stdout, stderr) {
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
process.env.ENVIRONMENT = argv.env || 'prod';
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
    console.log('Looking in folder: ' + getRootTestsFolder() + "\n");
    if (tests.length > 0) {
        console.log('Found these test suites:');
        tests.forEach(function (test) {
            console.log('  » ' + test.name);
        });
    }
    else {
        console.log('Did not find any tests.');
    }
}
else if (argv.suite) {
    let test = getTestByName(argv.suite);
    test ?
        run(test.filePath) :
        console.log('Could not find test suite: ' + argv.suite);
}
else if (argv.all) {
    tests.forEach(function (test) {
        run(test.filePath);
    });
}
