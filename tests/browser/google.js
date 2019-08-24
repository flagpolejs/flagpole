const Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.google.com/')
    .finally(suite => suite.print());

const browserOpts = {
    headless: false,
    recordConsole: true,
    outputConsole: false,
    width: 1024,
    height: 768,
};

const searchTerm = 'Flagpole QA Testing Framework';
const paths = {
    queryInput: 'input[name="q"]',
    submitButton: 'input[value="Google Search"]',
    searchResultsItem: '#search div.g'
}

suite.browser('Google Search for Flagpole', browserOpts)
    .open('/')
    .next(async context => {
        context.assert(context.response.statusCode).equals(200);
    })
    .next(async context => {
        const logo = await context.find('#hplogo');
        context.assert(await logo.getAttribute('alt')).equals('foo');
    })
    .next('Fill out form', async context => {
        //await context.page.type(paths.queryInput, searchTerm);
        const form = await context.find('form');
        await form.fillForm({
            q: searchTerm
        });
        const input = await context.find(paths.queryInput);
        context.assert('Search term matches what we typed', await input.getValue()).equals(searchTerm);
        const button = await context.find(paths.submitButton);
        context.assert(button).exists();
        //await context.click(paths.submitButton);
        await form.submit();
        await context.waitForNavigation();
        const results = await context.find(paths.searchResultsItem);
        await context.assert('Search results found', results).exists();
        await context.comment(await (await context.find('#searchform')).getClassName());
        return context.pause(1);
    })
    .next('see if evalulate works', async context => {
        const divCount = await context.evaluate(function () {
            return document.querySelectorAll('div').length;
        });
        context.comment(`There are ${divCount} divs in this page`);
        context.assert('There are more than one divs in it', divCount).greaterThan(0);
    });