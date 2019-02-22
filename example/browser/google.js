const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const Promise = bluebird;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.google.com/')
    .onDone(function (suite) {
        suite.print();
    });

const browserOpts = {
    headless: true,
    recordConsole: true,
    outputConsole: false,
    width: 1024,
    height: 768,
};

const homepage = suite.Scenario('Homepage')
    .browser(browserOpts)
    .open('/')
    .then((response) => {
        const scenario = response.scenario;
        const browser = scenario.getBrowser();

        response.assert(browser.has404() === false, "Has no 404 errors.");

        response.status().equals(200);
    })
    .then((response) => {
        const scenario = response.scenario;
        const browser = scenario.getBrowser();

        const page = browser.getPage();

        return Promise.mapSeries([
            () => page.type('input[name="q"]', 'Flagpole QA Testing Framework'),
            // For some reason this does not work.
            // () => page.click('input[type="submit"]'),
            () => page.evaluate(() => document.querySelector('input[type="submit"]').click()),
        ], (func) => func());
        // .then(() => {
        //     return new Promise(resolve => setTimeout(resolve, 10000));
        // });
    })
    .assertions((response) => {
        response.status().equals(200);
    });
