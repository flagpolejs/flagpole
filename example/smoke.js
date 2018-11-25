let Flagpole = require('../dist/index.js').Flagpole;

Flagpole.Suite('Smoke Tests')
    .base('http://www.stackoverflow.com')
    .setConsoleOutput(false)
    .onDone(function(suite) {
        suite.print();
    })

    .Scenario('Homepage').open('/').assertions(function(test) {
        test.status().equals(200)
            .headers('content-type').contains('text/html')
            .select('title').text().contains('Stack Overflow')
            .select('link')
            .not().select('frameset')
            .label('Top bar and call to actions exists')
            .comment('TOP BAR')
            .select('.top-bar').find('.-ctas').length().greaterThan(0)
            .label('Login Link exists')
            .and().find('a.login-link')
            .and().first().text().similarTo('Log in')
            .label('Sign up link exists')
            .select('a.login-link').nth(1)
            .and().text().similarTo('Sign Up')
            .select('.question-summary')
            .and().length().greaterThan(5)
            .select('.question-summary').first()
            .and().find('.views span').exists()
            .and().text().parseInt().greaterThan(0)
            .select('.question-summary').nth(2)
            .and().find('.status span').exists()
            .and().text().parseInt().greaterThanOrEquals(0);

        test.select('img').each(function (img, index) {
            img.load('Image ' + index);
        });

        test.select('link[rel="stylesheet"]').each(function (link, index) {
            link.load('Stylesheet ' + index);
        });

        test.select('script[src]').each(function (script, index) {
            script.load('Script ' + index);
        });

    });
