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
    .next(async function () {
        this.assert(this.response.statusCode).equals(200);
        (await this.assert(this.find(paths.queryInput)).resolvesTo).not.equals(null);
        //await this.page.type(paths.queryInput, searchTerm);
        const form = await this.find('form');
        const input = await this.find(paths.queryInput);
        this.comment(input);
        await form.fillForm({
            q: searchTerm
        });
        this.assert('Search term matches what we typed', await input.getValue()).equals(searchTerm);
        const button = await this.find(paths.submitButton);
        this.assert(button).exists();
        //await this.click(paths.submitButton);
        await form.submit();
        await this.waitForNavigation();
        const results = await this.find(paths.searchResultsItem);
        await this.assert('Search results found', results).exists();
        await this.comment(await (await this.find('#searchform')).getClassName());
        return this.pause(1);
    })
    .next('see if evalulate works', async function () {
        const divCount = await this.evaluate(function () {
            return document.querySelectorAll('div').length;
        });
        this.comment(`There are ${divCount} divs in this page`);
        this.assert('There are more than one divs in it', divCount).greaterThan(0);
    });