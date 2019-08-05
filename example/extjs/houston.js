const Flagpole = require('../../dist/index.js').Flagpole;

const suite = Flagpole.Suite('Test Houston')
    .base('http://houston.flosports.net/')
    .finally(() => { suite.print() });

const browserOpts = {
    headless: false,
    width: 1280,
    height: 768,
};

suite.extjs('My First ExtJS Scenario', browserOpts)
    .open('/')
    .next('Check that the page loaded propertly', async function () {
        const extExists = await this.evaluate(function () {
            return !!window['Ext'];
        });
        this.assert('ExtJS was found.', extExists).isTrue();
    })
    .next('Do some more tests', async function () {
        
    });