'use strict';


// Declare app level module which depends on filters, and services
angular.module('ricardo', [
  'ngRoute',
  'ngAnimate',
  'ui.bootstrap',
  'ricardo.filters',
  'ricardo.services',
  'ricardo.directives',
  'ricardo.controllers'
  ]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
  	templateUrl: 'partials/hello.html', 
  	controller: 'hello'
  });
  $routeProvider.otherwise({redirectTo: '/'});
}]);
