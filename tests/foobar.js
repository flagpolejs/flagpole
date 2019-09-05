const { Flagpole } = require('flagpole');

const suite = Flagpole.suite('Do a test')
   .base('https://www.google.com');

suite.browser("Do something")
   .open("/")
   .next(async context => {
       
   });

