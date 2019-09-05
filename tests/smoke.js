const { Flagpole } = require('../dist/index');

const suite = Flagpole.suite('Basic Smoke Test of Site')
   .base('https://www.google.com');

suite.html("Homepage Loads")
   .open("/")
   .next(async context => {
       
   });

