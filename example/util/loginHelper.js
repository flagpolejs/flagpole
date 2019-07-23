const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const uiTestHelper = require('./uiTestHelper');

const doLogin = function (page, username, password) {
    return bluebird.mapSeries([
        () => page.type('input[name="username"]', username),
        () => page.type('input[name="password"]', password),
        () => page.click('button')
    ], (func) => func());
}

const login = function(response){
    response.assert(response.status() == 200, 'Login Status 200');
    const page = uiTestHelper.getPageForResponse(response);
    // First, make sure our button is really loaded using a waitFor 
    return page.waitForFunction(() => Array.from(document.querySelectorAll('button')).length > 0, {
        polling: 250,
        timeout: 5000,
    })
    // Second, do what we need to do on the page
    .then(() => doLogin(page, 'scorecarduser@gmail.com', 'FloSports2019'))
    .then(() => page.waitForNavigation({waitUntil: 'networkidle2'}));
}

exports.login = login;
