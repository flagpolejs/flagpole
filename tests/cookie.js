const { Flagpole } = require('../dist/index.js');

Flagpole.automaticallyPrintToConsole = true;

const suite = Flagpole.Suite('Basic Smoke Test of Site')
    .base('https://www.milesplit.com');

suite.html('Not logged in test')
    .open('/athletes/3888271/stats')
    .next(function (context) {
        context.comment(context.response.finalUrl);
    });
