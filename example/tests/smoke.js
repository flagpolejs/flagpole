let Flagpole = require('../../dist/index.js').Flagpole;

Flagpole.Suite('Smoke Tests')
    .base('http://www.stackoverflow.com')

    .Scenario('Homepage').open('/')
    .assertions(function(test) {
        test
            .status().equals(200)
            .headers().contains('content-type')
            .headers('content-type').contains('text/html')
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
            .and().parseInt().greaterThan(0)
            .select('.question-summary').nth(2)
            .and().find('.status span').exists()
            .and().parseInt().greaterThanOrEquals(0)
            .select('#tabs').exists()
            .select('#tabs a').length().equals(5)
            .select('#tabs a').first().text().contains('interesting')
            .select('#tabs a').nth(1).text().contains('featured')
            .select('#tabs a').nth(2).text().contains('hot')
            .select('#tabs a').nth(2).attribute('href').echo();

        test.comment('start each test')
            .select('#tabs a').each(function(element) {
                element.attribute('href').exists();
            });



    })


