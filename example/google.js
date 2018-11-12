let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test Google')
    .base('http://www.google.com')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });

let homepage = suite.Scenario('Homepage').open('/')
    .assertions(function (test) {
        test
            .status().equals(200)
            .headers('content-type').contains('text/html');

        test.select('form')
            .attribute('action').equals('/search')
            .getLastElement()
            .fillForm({
                q: 'milesplit'
            })
            .submit(searchResults);


    });

let searchResults = suite.Scenario('Search Results')
    .assertions(function (test) {
        test
            .status().equals(200)
            .headers('content-type').contains('text/html');
        
        test.select('input[name="q"]').val().equals('milesplit');

        test.loadTime().echo().lessThan(1000);
        
    });