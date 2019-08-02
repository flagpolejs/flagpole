let Flagpole = require('../dist/index.js').Flagpole;

Flagpole.Suite('Smoke Tests')
    .base('http://www.stackoverflow.com')
    .finally(function (suite) {
        suite.print();
    })
    .html('Homepage').open('/')
    .next('Do basic homepage tests', function () {
        this.response.status().equals(200)
            .headers('content-type').contains('text/html')
            .select('title').text().contains('Stack Overflow')
            .select('link')
            .not().select('frameset');
    })
    .next('Test the top navigation bar', function () {
        this.response
            .label('Top bar and call to actions exists')
            .select('.top-bar').find('.-ctas').length().greaterThan(0)
            .label('Login Link exists')
            .and().find('a.login-link')
            .and().first().text().similarTo('Log in')
            .label('Sign up link exists')
            .select('a.login-link').nth(1)
            .and().text().similarTo('Sign Up');
    })
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
