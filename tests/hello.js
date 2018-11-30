const { Flagpole } = require('flagpole');

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base({
      stag: 'https://www.google.com',
      prod: 'https://www.yahoo.com',
      qa: 'https://www.espn.com',
      rc: 'https://www.msn.com',

   }
);

suite.Scenario('Homepage Loads')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
