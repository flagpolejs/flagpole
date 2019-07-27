let Flagpole = require('../dist/index.js').Flagpole;

Flagpole.Suite('Smoke Tests')
    .base('http://www.stackoverflow.com')
    .Scenario('Homepage').open('/')
    .then(function() {
        console.log(this);
    });
