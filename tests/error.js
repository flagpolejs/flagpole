const Flagpole = require('../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test NPM')
    .base('https://www.npmjs.com');

suite.html('Load front page of NPM')
    .open('/')
    .next(async (context) => {
        const nothing = await context.find('a.bg-red-hot');
        context.assert(nothing).exists();
        const link = await context.find('a.bg-red-hot');
        context.assert(link).exists();
        context.assert(await link.getText()).equals('foo');
        context.assert(await link.getText()).like('see plans');
        const search = await context.find('#search');
        context.assert(search).exists();
        context.assert(await search.getAttribute('method')).equals('post');
        context.assert(await search.getAttribute('action')).equals('/search');
    });
