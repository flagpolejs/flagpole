const { Flagpole } = require('../dist/index.js');

const suite = Flagpole.Suite('Basic Cookie Test of Site')
    .base('https://www.milesplit.com');

suite.html('Not logged in test')
    .open('/athletes/3888271/stats')
    .next('Boo', (context) => {
        context.comment(context.response.finalUrl);
    });
