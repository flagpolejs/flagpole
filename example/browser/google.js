const Flagpole = require('../../dist/index.js').Flagpole;
Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.google.com/')
    .finally(() => { suite.print() });

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
        this.assert('Landing Page HTTP Status is 200', this.response.status()).equals(200);
        await this.assert('Wait for search input box', this.exists(paths.queryInput)).resolves();
        //await this.page.type(paths.queryInput, searchTerm);
        const form = await this.select('form');
        await form.fillForm({
            q: searchTerm
        });
        this.assert('Search term matches what we typed', await this.val(paths.queryInput)).equals(searchTerm);
        await this.assert('Search button exists', this.exists(paths.submitButton)).resolves();
        await this.click(paths.submitButton);
        await this.page.waitForNavigation();
        await this.assert('Search results found', this.exists(paths.searchResultsItem)).resolves();
        await this.comment(await (await this.select('#searchform')).getClassName());
        return this.pause(1);
    });