const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const Promise = bluebird;

Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.google.com/')
    .onDone(function (suite) {
        suite.print();
    });

const browserOpts = {
    headless: true,
    recordConsole: true,
    outputConsole: false,
    width: 1024,
    height: 768,
};

suite.Scenario('Homepage')
    .browser(browserOpts)
    .open('/')
    .then((response) => {
        response.status().equals(200);
    });