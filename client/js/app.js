'use strict';


// Declare app level module which depends on filters, and services
angular.module('ricardo', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select',
  'ngGrid',
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
    controller: 'bilateral',
    resolve: {
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities('data/reporting_countries.json')
      }
    }
  });
  $routeProvider.when('/country', {
    templateUrl: 'partials/country.html',
    controller: 'country',
    resolve: {
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities('data/reporting_countries.json')
      }
    }
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
