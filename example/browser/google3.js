const Flagpole = require('../../dist/index.js').Flagpole;
Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://fl.milesplit.com/')
    .finally(() => { suite.print() });

suite.Browser('Google Search for Flagpole')
    .open('/')
    .then(function () {
        
    });