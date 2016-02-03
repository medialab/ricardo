'use strict';


/*
 * Declare app level module which depends on filters, and services
 */ 
angular.module('ricardo', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ngGrid',
  'ui.select',
  'angular-loading-bar',
  'pascalprecht.translate',
  'angulartics',
  'angulartics.google.analytics',
  'ricardo.filters',
  'ricardo.services',
  'ricardo.services.country',
  'ricardo.directives',
  'ricardo.controllers.navbar',
  'ricardo.controllers.TranslateController',
  'ricardo.controllers.bilateral',
  'ricardo.controllers.country',
  'ricardo.controllers.world',
  'ricardo.controllers.network'
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
        return apiService.getReportingEntities({'type_filter': 'country'})
      }
    }
  });
  $routeProvider.when('/world', {
    templateUrl: 'partials/world.html',
    controller: 'world',
    resolve: {
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'partners_ids': 'Worldbestguess'})
      },
      reportingWorldFlows : function (apiService) {
        return apiService.getWorldFlows()
      }
    }
  });
  $routeProvider.when('/network', {
    templateUrl: 'partials/network.html',
    controller: 'network',
  });
  $routeProvider.otherwise({redirectTo: '/'});
}])
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeBar = false;
  }])
  .config(function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'js/locale-',
      suffix: '.json'
    });
    $translateProvider.use('en_EN');
  });
  
