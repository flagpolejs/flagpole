const Flagpole = require('../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test NPM')
    .base('https://www.npmjs.com')
    .finally(suite => suite.print());

suite.html('Load front page of NPM')
    .open('/')
    .next(async (context) => {
        const nothing = await context.find('air');
        nothing.exists();
    });
