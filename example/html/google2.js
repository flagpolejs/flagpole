const Flagpole = require('../../dist/index.js').Flagpole;

const searchTerm = 'Flagpole JS';

const suite = Flagpole.suite('Basic Smoke Test of Site')
    .base('https://www.google.com')
    .finally(suite => suite.print());

suite.html('Homepage Loads')
    .open('/')
    .next('Test the basic headers', (ctx) => {
        ctx.assert('Status is 200', ctx.response.statusCode)
            .equals(200);
    })
    .next('Fill out the search form', async (ctx) => {
        const form = await ctx.find('form');
        const searchBox = await ctx.find('input[name="q"]');
        ctx.assert('Form exists on the page', form).exists();
        ctx.assert(searchBox).exists();
        await form.fillForm({
            q: searchTerm
        });
        ctx.assert(await searchBox.getValue()).equals(searchTerm);
        form.submit('Submit form and check results page', async function () {
            const result = await this.find('a[href*="https://www.npmjs.com/package/flagpole"]');
            this.assert(result).exists();
        });
    });
