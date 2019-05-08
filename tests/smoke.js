const { Flagpole } = require('../dist/index.js');

Flagpole.automaticallyPrintToConsole = true;

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base('https://www.google.com');

suite.Scenario('Homepage Loads')
   .open('/')
   .html()
   .assertions(function (response) {
      response.comment('asdfas');
   });
