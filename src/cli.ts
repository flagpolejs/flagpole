#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');


class TestSuite {

    public filePath: string = '';
    public fileName: string = '';
    public name: string = '';

    constructor(dir: string, file: string) {
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(process.cwd() + '/tests/', '') + file.split('.').slice(0, -1).join('.');
    }

}

// Get root test folder
let getRootTestsFolder = function() {
    return argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
};

// Get all of the tests available
let tests = (function(startDirectory) {

    let tests: Array<TestSuite> = [];

    let findTests = function(dir) {
        // Does this folder exist?
        if (fs.existsSync(dir)) {
            // Read contents
            let files = fs.readdirSync(dir);
            files.forEach(function(file) {
                if (fs.statSync(dir + file).isDirectory()) {
                    tests = findTests(dir + file + '/');
                }
                // Push in any JS files, but without the extension
                else if (file.match(/.js$/)) {
                    tests.push(new TestSuite(dir, file));
                }
            });
        }

        return tests;
    };

    return findTests(startDirectory);

})(getRootTestsFolder());

let run = function(testFilePath) {
    exec('node ' + testFilePath, function(err, stdout, stderr) {
        if (err) {
            // node couldn't execute the command
            return;
        }
        console.log(`${stdout}`);
        console.log(`${stderr}`);
    });
};

let getTestByName = function(name) {
    for (let i=0; i < tests.length; i++) {
        if (tests[i].name == name) {
            return tests[i];
        }
    }
};

// Get environment from command
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

// List available test suites
if (argv.list) {
    console.log('Looking in folder: ' + getRootTestsFolder() + "\n");
    if (tests.length > 0) {
        console.log('Found these test suites:');
        tests.forEach(function(test) {
            console.log('  » ' + test.name);
        });
    }
    else {
        console.log('Did not find any tests.');
    }
}
// Run a specific test suite
else if (argv.suite) {
    let test = getTestByName(argv.suite);
    test ?
        run(test.filePath) :
        console.log('Could not find test suite: ' + argv.suite);
}
// Run all test suites
else if (argv.all) {
    tests.forEach(function(test) {
        run(test.filePath);
    });
}
