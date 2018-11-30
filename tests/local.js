const { Flagpole } = require('../dist/index.js');

const suite = Flagpole.Suite('Test local')
   .base({
      dev: 'https://www.milesplit.local',
      prod: 'https://www.milesplit.com',
   })
   .verifySslCert(false);

suite.Scenario('Local request')
   .open('/')
   .html()
   .assertions(function (response) {
       
   });
