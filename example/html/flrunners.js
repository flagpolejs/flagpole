const Flagpole = require('../../dist/index.js').Flagpole;
Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://fl.milesplit.com/')
    .finally(() => { suite.print() });

suite.Html('MileSplit Florida - Browser Test')
    .open('/')
    .then(async function () {
        this.assert(this.response.status())
            .equals(200);
        this.assert('Jason').is('string');
        this.assert(this.exists('section.videos')).resolves();
    });