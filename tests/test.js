const Flagpole = require('../dist/index.js').Flagpole;
const nock = require('nock');
const fs = require('fs');

Flagpole.automaticallyPrintToConsole = true;

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
    .base('http://test.flagpole');

suite.html('Test 1')
    .open('/test.html')
    .next(function (context) {
        context.assert(context.response.statusCode).equals(200);

        context.assert(await context.find('a')).length.greaterThan(0);

        (await context.find('a[href^="/"]')).forEach((link) => {
            link.click();
        });

    });
