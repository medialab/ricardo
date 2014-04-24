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
  	templateUrl: 'partials/home.html'
  });
  $routeProvider.when('/bilateral', {
    templateUrl: 'partials/bilateral.html',
    controller: 'bilateral'
  });
  $routeProvider.when('/country', {
    templateUrl: 'partials/country.html',
    controller: 'country'
  });
  $routeProvider.when('/world', {
    templateUrl: 'partials/world.html',
    controller: 'world'
  });
  $routeProvider.when('/timeline', {
    templateUrl: 'partials/timeline.html',
    controller: 'timeline'
  });
  $routeProvider.when('/federation', {
    templateUrl: 'partials/federation.html',
    controller: 'federation'
  });
  $routeProvider.otherwise({redirectTo: '/'});
}]);
