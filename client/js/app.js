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
  'pascalprecht.translate',
  'ricardo.filters',
  'ricardo.services',
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
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'partners_ids': 'Worldbestguess'})
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
      },
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities()
      },
    }
  });
  $routeProvider.when('/about', {
    templateUrl: 'partials/about.html',
    controller: 'about'
  });
  $routeProvider.otherwise({redirectTo: '/'});
}])
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeBar = false;
  }])
  .config(function($translateProvider) {
    $translateProvider.translations('en', {
      HEADLINE: 'Hello there, This is my awesome app!',
      INTRO_TEXT: 'And it has i18n support!'
    })
    .translations('fr', {
      HEADLINE: 'Salut',
      INTRO_TEXT: 'Coucou !'
    });
    $translateProvider.preferredLanguage('en');
  });
  // .config(function (uiSelectConfig) {
  //   uiSelectConfig.theme = 'bootstrap';
  //   uiSelectConfig.resetSearchInput = true;
  //   uiSelectConfig.appendToBody = true;
  // });


// Scroll spy for sticky brushing timeline
// $(window).scroll(function(){
//   var offset = $('#sticky-marker').offset().top
//     , scrollPos = $(window).scrollTop()

//   if(scrollPos >= offset + 180){
    
//     $('#sticky-container').addClass('sticky-container-fixed')
//     $('#sticky-marker').addClass('sticky-placeholder')
//     $('#alt-title').show()

//   } else {
    
//     $('#sticky-container').removeClass('sticky-container-fixed')
//     $('#sticky-marker').removeClass('sticky-placeholder')
//     $('#alt-title').hide()

//   }
// })


