const { Flagpole } = require('../dist/index.js');

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base({
      dev: 'https://www.google.com',
      prod: 'https://www.yahoo.com'
   });

suite.Scenario('Basic Smoke Test of Site')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
