let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test MileSplit')
    .base('https://www.milesplit.com')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });

suite.Scenario('Homepage').open('/')
    .assertions(function (test) {
        test.status().equals(200);
        test.headers('content-type').contains('text/html');
        
        test.select('figure[style]').each(function (figure, index) {
            figure.css('background-image').load('Test BG Image ' + index).assertions(function (response) {
                response.url().echo();
                response.length().echo();
            });
        });

    });
