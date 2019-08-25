const Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.milesplit.com/');

const browserOpts = {
    headless: false,
    recordConsole: true,
    outputConsole: false,
    width: 1024,
    height: 768,
};

suite.browser('Test MileSplit', browserOpts)
    .open('/')
    .next(async context => {
        context.assert(context.response.statusCode).equals(200);
    });