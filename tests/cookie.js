const { Flagpole } = require('../dist/index.js');

Flagpole.automaticallyPrintToConsole = true;

const suite = Flagpole.Suite('Basic Smoke Test of Site')
    .base('https://www.milesplit.com');

suite.Scenario('Homepage Loads')
    .open('/')
    .html()
    .cookie('flagpole', 'yes')
    .assertions(function (response) {
        response.cookies('unique_id').text().echo().length().greaterThan(0);
        response.cookies('flagpole').text().equals('yes');
    });
