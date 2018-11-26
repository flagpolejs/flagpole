let Flagpole = require('../dist/index.js').Flagpole;

let suite = Flagpole.Suite('Test')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });;

suite.Scenario('Test 1')
    .mock('../tests/mock/test.html')
    .assertions(function (test) {
        test.status().equals(200);

        test.select('a').length().greaterThan(0);

        test.select('a[href^="http"]').each(function (link) {
            link.tagName().equals('a');
        });

    });
