const { Flagpole } = require('../dist/index.js');

Flagpole.automaticallyPrintToConsole = true;

const suite = Flagpole.Suite('Basic Smoke Test of Site')
    .base('https://www.milesplit.com');

suite.Scenario('Not logged in test')
    .html()
    .open('/')
    .assertions(function (response) {
        response.not().select('strong.hello');
    });
