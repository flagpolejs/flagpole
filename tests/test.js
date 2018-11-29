const Flagpole = require('../dist/index.js').Flagpole;
const nock = require('nock');
const fs = require('fs');

let mockRoutes = nock('http://test.flagpole');

mockRoutes.get('/test.html')
    .reply(200, function (uri, requestBody) {
        return fs.createReadStream(__dirname + '/mock/test.html');
    });

mockRoutes.get('/test2.html')
    .reply(200, function (uri, requestBody) {
        return fs.createReadStream(__dirname + '/mock/test2.html');
    });

let suite = Flagpole.Suite('Test')
    .base('http://test.flagpole')
    .setConsoleOutput(false)
    .onDone(function (suite) {
        suite.print();
    });

suite.Scenario('Test 1')
    .open('/test.html')
    .assertions(function (test) {
        test.status().equals(200);

        test.select('a').length().greaterThan(0);

        test.select('a[href^="/"]').each(function (link) {
            link.click('Test 2', true);
        });

    });



suite.Scenario('Test My API')
   .open('/api')
   .json()
   .assertions(function (response) {
       
   });


suite.Scenario('See if the API loads')
   .open('/api')
   .json()
   .assertions(function (response) {
       
   });
