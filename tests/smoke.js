const { Flagpole } = require('flagpole');

const suite = Flagpole.Suite('Basic Smoke Test of Site')
   .base('https://www.google.com');

suite.Scenario('Basic Smoke Test of Site')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
