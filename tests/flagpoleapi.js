const { Flagpole } = require('../dist/index.js');

const suite = Flagpole.Suite('Basic Tests of the API')
   .base({
      dev: 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net',
      prod: 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net',
   });


suite.Scenario('Login').open('/api/token').method('post').json()
   .jsonBody({
      email: 'jason.byrne@flosports.tv',
      password: 'test1234'
   })
   .assertions(function (response) {
      response.status().equals(201);
      response.select('data.token').length().greaterThan(0);
   });


suite.Scenario('Get a Project').open('/api/project/YzYQG6HV3BJ8DvwQyyog?token=b82566769f2ee686953d2c3a4691705e').json()
   .assertions(function (response) {
      response.status().equals(200);
   });


suite.Scenario('Get a User').open('/api/user/Xuq56dUKoTcL5Y83Ud6j?token=b82566769f2ee686953d2c3a4691705e').json()
   .assertions(function (response) {
      response.status().equals(200);
   });


suite.Scenario('Get a Projects of a User').open('/api/users/Xuq56dUKoTcL5Y83Ud6j/projects?token=b82566769f2ee686953d2c3a4691705e').json()
   .assertions(function (response) {
      response.status().equals(200);
   });

