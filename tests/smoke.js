const { Flagpole } = require('flagpole');

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base({
      dev: 'https://www.google.com',
      prod: 'https://www.google.com',
   });

suite.Scenario('Homepage Loads')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
