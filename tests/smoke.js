const { Flagpole } = require('../dist/index');

const suite = Flagpole.suite('Basic Smoke Test of Site');

suite.html("Homepage Loads")
   .open("/")
   .next(async context => {
       
   });

