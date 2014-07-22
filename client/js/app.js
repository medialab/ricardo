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
        return apiService.getReportingEntities({'type_filter': 'country'})
      }
    }
  });
  $routeProvider.when('/country', {
    templateUrl: 'partials/country.html',
    controller: 'country',
    resolve: {
      reportingEntities : function (apiService) {
        //return apiService.getReportingEntities({'type_filter': 'country'})
        return apiService.getReportingEntities()
      }
    }
  });
  $routeProvider.when('/world', {
    templateUrl: 'partials/world.html',
    controller: 'world',
    resolve: {
      reportingEntities : function (apiService) {
        //return apiService.getReportingEntities({'type_filter': 'colonial_area,country,geographical_area','to_world_only': 1})
        return apiService.getReportingEntities({'type_filter': 'colonial_area,country,geographical_area','to_world_only': 1})
      }
    }
  });
  $routeProvider.when('/continent', {
    templateUrl: 'partials/continent.html',
    controller: 'continent'
  });
  // $routeProvider.when('/federation', {
  //   templateUrl: 'partials/federation.html',
  //   controller: 'federation'
  // });
  $routeProvider.otherwise({redirectTo: '/'});
}]);
