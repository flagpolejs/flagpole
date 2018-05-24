#!/usr/bin/env node
'use strict';
let argv = require('yargs').argv;
let exec = require('child_process').exec;
let fs = require('fs');

// Read command line arguments
process.env.ENVIRONMENT = argv.env || 'prod';
process.env.SUITE = argv.suite || null;
process.env.GROUP = argv.group || null;
process.env.ROOT_FOLDER = (function() {
    // Default root folder
    let rootFolder: string = argv.group ? process.cwd() + '/tests/' + argv.group + '/' : process.cwd() + '/tests/';
    // Override
    if (argv.root) {
        rootFolder = argv.root;
        rootFolder = (rootFolder.match(/\/$/) ? rootFolder : rootFolder + '/') + 'tests/';
    }
    return rootFolder;
})();


/**
 * Will hold a suite file that we find in the specified folder
 */
class TestSuiteFile {

    public filePath: string = '';
    public fileName: string = '';
    public name: string = '';

    constructor(dir: string, file: string) {
        this.filePath = dir + file;
        this.fileName = file;
        this.name = dir.replace(String(process.env.ROOT_FOLDER), '') + file.split('.').slice(0, -1).join('.');
    }

}

/**
 * Execute a test
 *
 * @param filePath: string
 */
let runTestFile = function(filePath: string) {
    exec('node ' + filePath, function(err, stdout, stderr) {
        if (err) {
            // node couldn't execute the command
            return;
        }
        console.log(`${stdout}`);
        console.log(`${stderr}`);
    });
};

/**
 * Find a test with this name in our list of available tests
 *
 * @param name: string
 * @returns {TestSuiteFile}
 */
let getTestByName = function(name: string) {
    for (let i=0; i < tests.length; i++) {
        if (tests[i].name == name) {
            return tests[i];
        }
    }
};

// Get all of the tests available
let tests = (function(): Array<TestSuiteFile> {

    let tests: Array<TestSuiteFile> = [];

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
                    tests.push(new TestSuiteFile(dir, file));
                }
            });
        }

        return tests;
    };

    return findTests(process.env.ROOT_FOLDER);

})();


/**
 *  Header branding
 */
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
    console.log('Looking in folder: ' + process.env.ROOT_FOLDER + "\n");
    if (tests.length > 0) {
        console.log('Found these test suites:');
        tests.forEach(function(test) {
            console.log('  » ' + test.name);
        });
        console.log("\n");
    }
    else {
        console.log("Did not find any tests.\n");
    }
}
// Run a specific test suite
else if (argv.suite) {
    let test = getTestByName(argv.suite);
    test ?
        runTestFile(test.filePath) :
        console.log('Could not find test suite: ' + argv.suite + "\n");
}
// Run all test suites
else if (argv.all) {
    tests.forEach(function(test) {
        runTestFile(test.filePath);
    });
}
