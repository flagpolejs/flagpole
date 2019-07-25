const Flagpole = require('../../dist/index.js').Flagpole;
const bluebird = require('bluebird');
const Promise = bluebird;

Flagpole.exitOnDone = true;

const suite = Flagpole.Suite('Test Google Search')
    .base('https://www.google.com/')
    .then(() => {
        console.log('suite then');
    })
    .success(() => {
        console.log('suite success');
    })
    .finally((suite) => {
        console.log('suite finally');
        //suite.print();
    });

const browserOpts = {
    headless: false,
    recordConsole: true,
    outputConsole: false,
    width: 1024,
    height: 768,
};

suite.Scenario('Homepage')
    .browser(browserOpts)
    .open('/')
    .then((response) => {
        response.assert(response.scenario.getBrowser().has404() === false, "Has no 404 errors.");
        response.status().equals(200);
    })
    .then((response) => {
        const page = response.scenario.getBrowser().getPage();

        return Promise.mapSeries([
            () => page.type('input[name="q"]', 'Flagpole QA Testing Framework'),
            () => page.evaluate(() => document.querySelector('input[type="submit"]').click()),
        ], (func) => func());

    })
    .then((response) => {
        response.status().equals(200);
    })
    .then(() => {
        console.log('scenario last then');
    })
    .success(() => {
        console.log('scenario success');
    })
    .catch(() => {
        console.log('scenario catch');
    })
    .finally(() => {
        console.log('scenario finally');
    });
