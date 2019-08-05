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
        this.assert(this.response.status()).equals(200);
        (await this.assert(this.select(paths.queryInput)).resolvesTo).not.equals(null);
        //await this.page.type(paths.queryInput, searchTerm);
        const form = await this.select('form');
        await form.fillForm({
            q: searchTerm
        });
        this.assert('Search term matches what we typed', await this.val(paths.queryInput)).equals(searchTerm);
        const button = await this.select(paths.submitButton);
        this.assert(button).exists();
        //await this.click(paths.submitButton);
        await form.submit();
        await this.page.waitForNavigation();
        await this.assert('Search results found', this.exists(paths.searchResultsItem)).resolves();
        await this.comment(await (await this.select('#searchform')).getClassName());
        return this.pause(1);
    })
    .next('see if evalulate works', async function () {
        const divCount = await this.evaluate(function () {
            return document.querySelectorAll('div').length;
        });
        this.comment(`There are ${divCount} divs in this page`);
        this.assert('There are more than one divs in it', divCount).greaterThan(0);
    });