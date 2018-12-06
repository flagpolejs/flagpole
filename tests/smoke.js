const { Flagpole } = require('../dist/index.js');

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base('https://www.google.com');

suite.Scenario('Homepage Loads')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
