let Flagpole = require('../../dist/index.js').Flagpole;

Flagpole.Suite('Stack Overflow')
    .base('http://www.stackoverflow.com')
    .finally(function (suite) {
        suite.print();
    })
    .html('Homepage').open('/')
    .next('Check basic parameters', async function (response) {
        this.assert(response.httpStatusCode).equals(200);
        this.assert(response.header('content-type')).contains('text/html');
        const title = await this.select('title');
        this.assert(await title.getText()).contains('Stack Overflow');
    })
    .next('Test the top navigation bar', async function () {
        this.assert((await this.selectAll('.top-bar .-ctas')).length)
            .greaterThan(0);
        const loginLink = await this.select('a.login-link');
        this.assert(loginLink).exists();
        this.assert(await loginLink.getText()).like('Log In');
    })
    /*
    .next('There should be questions', function () {
        this.response
            .select('.question-summary')
            .and().length().greaterThan(5)
            .select('.question-summary').first()
            .and().find('.views span').exists()
            .and().text().parseInt().greaterThan(0)
            .select('.question-summary').nth(2)
            .and().find('.status span').exists()
            .and().text().parseInt().greaterThanOrEquals(0);
    })
    .next('Test that each image exists', function () {
        this.response.select('img').each(function (img, index) {
            img.load('Image ' + index, true);
        });
    })
    .next('Test that the stylesheets exist', function () {
        this.response.select('link[rel="stylesheet"]').each(function (link, index) {
            link.load('Stylesheet ' + index, true);
        });
    })
    .next('Test that the javascript files exist', function () {
        this.response.select('script[src]').each(function (script, index) {
            script.load('Script ' + index, true);
        })
    })
    */
