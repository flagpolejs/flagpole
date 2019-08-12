const Flagpole = require('../dist/index.js').Flagpole;

const suite = Flagpole.suite('Test order of callbacks')
    .base('https://www.whatismyip.com')
    .beforeAll(() => {
        console.log('Before All');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Resolved Before All');
                resolve();
            }, 1000);
        });
    })
    .beforeEach(() => {
        console.log('Before Each');
    })
    .afterEach(() => {
        console.log('After Each');
    })
    .afterAll(() => {
        console.log('After All');
    })
    .success(() => {
        console.log('Suite Success');
    })
    .failure(() => {
        console.log('Suite Failure');
    })
    .catch(() => {
        console.log('Suite Catch');
    })
    .finally(() => {
        console.log('Suite Finally');
    });

suite.html('Main Page')
    .open('/')
    .before(() => {
        console.log('Before First Scenario');
    })
    .after(() => {
        console.log('After First Scenario');
    })
    .success(() => {
        console.log('Success First Scenario');
    })
    .failure(() => {
        console.log('Failure First Scenario');
    })
    .catch(() => {
        console.log('Catch First Scenario');
    })
    .finally(() => {
        console.log('Finally First Scenario');
    })
    .next(async function () {
        console.log('Next First Scenario');
    });

suite.html('IP Lookup')
    .open('/ip-address-lookup/')
    .before(() => {
        console.log('Before Second Scenario');
    })
    .after(() => {
        console.log('After Second Scenario');
    })
    .success(() => {
        console.log('Success Second Scenario');
    })
    .failure(() => {
        console.log('Failure Second Scenario');
    })
    .catch(() => {
        console.log('Catch Second Scenario');
    })
    .finally(() => {
        console.log('Finally Second Scenario');
    })
    .next(async function () {
        console.log('Next Second Scenario');
    });

suite.html('Change IP')
    .open('/how-to-change-your-ip-address/')
    .before(() => {
        console.log('Before Third Scenario');
    })
    .after(() => {
        console.log('After Third Scenario');
    })
    .success(() => {
        console.log('Success Third Scenario');
    })
    .failure(() => {
        console.log('Failure Third Scenario');
    })
    .catch(() => {
        console.log('Catch Third Scenario');
    })
    .finally(() => {
        console.log('Finally Third Scenario');
    })
    .next(async function () {
        console.log('Next Third Scenario');
    });

