const { Flagpole } = require('../dist/index.js');
const request = require('request');

Flagpole.automaticallyPrintToConsole = true;

const suite = Flagpole.Suite('Basic Tests of the API')
   .base({
      dev: 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net',
      prod: 'https://us-central1-flagpolejs-5ea61.cloudfunctions.net',
   });


const userLogin = {
   email: 'jason.byrne@flosports.tv',
   password: 'test1234'
};
const token = '01c48d5c-761f-2069-9b45-8ffcbee1d89a';
const userId = 'Xuq56dUKoTcL5Y83Ud6j';
const projectId = '89FlnTVjMEb5ZhUkovPt';

suite.Scenario('Create a user that already exists').open('/api/user').method('post').json()
   .jsonBody(userLogin)
   .assertions(function (response) {
      response.status().equals(400);
      response.select('error.message').length().greaterThan(0);
   });

suite.Scenario('Login').open('/api/token').method('post').json()
   .jsonBody(userLogin)
   .assertions(function (response) {
      response.status().equals(201);
      response.select('data.token').length().greaterThan(0);
   });


suite.Scenario('Get a Project').open('/api/project/' + projectId + '?token=' + token).json()
   .assertions(function (response) {
      response.status().equals(200);
   });

suite.Scenario('Get Project Settings').open('/api/project/' + projectId + '/settings?token=' + token).json()
   .assertions(function (response) {
      response.status().equals(200);
      response.select('data.project.name').length().greaterThan(0);
      response.select('data.project.path').length().greaterThan(0);
   });

suite.Scenario('Get a User').open('/api/user/' + userId + '?token=' + token).json()
   .assertions(function (response) {
      response.status().equals(200);
   });


suite.Scenario('Get a Projects of a User').open('/api/user/' + userId + '/projects?token=' + token).json()
   .assertions(function (response) {
      response.status().equals(200);
   });

