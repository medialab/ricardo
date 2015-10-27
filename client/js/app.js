'use strict';


// Declare app level module which depends on filters, and services
angular.module('ricardo', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select',
  'ngGrid',
  'angular-loading-bar',
  'ricardo.filters',
  'ricardo.services',
  // 'ricardo.directives',
  'ricardo.directives-addendum',
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
        return apiService.getReportingEntities({'type_filter': 'country'})
      }
    }
  });
  $routeProvider.when('/world', {
    templateUrl: 'partials/world.html',
    controller: 'world',
    resolve: {
      reportingColonialEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'colonial_area','to_partner_ids': "Worldbestguess"})
      },
      reportingCountryEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'country','to_partner_ids': "Worldbestguess"})
      },
      reportingGeoEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'geographical_area','to_partner_ids': "Worldbestguess"})
      },
      reportingContinentEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'continent','to_partner_ids': "Worldbestguess"})
      },
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'country'})
      },
      reportingWorldFlows : function (apiService) {
        return apiService.getWorldFlows()
      }
    }
  });
  $routeProvider.when('/RICentities', {
    templateUrl: 'partials/RICentities.html',
    controller: 'RICentities',
    resolve: {
      RICentities : function (apiService) {
        return apiService.getRICEntities()
      }
    }
  });
  $routeProvider.otherwise({redirectTo: '/'});
}])
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeBar = false;
  }])
  .config(function (uiSelectConfig) {
    uiSelectConfig.theme = 'bootstrap';
    uiSelectConfig.resetSearchInput = true;
    uiSelectConfig.appendToBody = true;
  });


// Scroll spy for sticky brushing timeline
$(window).scroll(function(){
  var offset = $('#sticky-marker').offset().top
    , scrollPos = $(window).scrollTop()

  if(scrollPos >= offset + 180){
    
    $('#sticky-container').addClass('sticky-container-fixed')
    $('#sticky-marker').addClass('sticky-placeholder')
    $('#alt-title').show()

  } else {
    
    $('#sticky-container').removeClass('sticky-container-fixed')
    $('#sticky-marker').removeClass('sticky-placeholder')
    $('#alt-title').hide()

  }
})