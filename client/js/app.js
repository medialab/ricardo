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
  'oc.lazyLoad',
  'angulartics',
  'angulartics.google.analytics',
  'ricardo.filters',
  'ricardo.services',
  'ricardo.directives',
  'ricardo.controllers.navbar',
  'ricardo.controllers.TranslateController'
  // 'ricardo.controllers.bilateral',
  // 'ricardo.controllers.country',
  // 'ricardo.controllers.world'
  ]).
config(['$routeProvider', function($routeProvider) {

  $routeProvider.when('/', {
  	templateUrl: 'partials/home.html'
  });
  $routeProvider.when('/bilateral', {
    templateUrl: 'partials/bilateral.html',
    controller: 'bilateral',
    resolve: {
      lazy: ['$ocLazyLoad', function($ocLazyLoad) {
          return $ocLazyLoad.load({
              name: 'ricardo',
              files: [
                  'controllers/bilateral.controller.js',
                  'directives/comparisonTimeline.directive.js'
              ]
          })
      }],
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'country'})
      }
    }
  });
  $routeProvider.when('/country', {
    templateUrl: 'partials/country.html',
    controller: 'country',
    resolve: {
      lazy: ['$ocLazyLoad', function($ocLazyLoad) {
          return $ocLazyLoad.load({
              name: 'ricardo',
              files: [
                  'controllers/country.controller.js',
                  'directives/partnersHistogram.directive.js'
              ]
          })
      }],
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'type_filter': 'country'})
      }
    }
  });
  $routeProvider.when('/world', {
    templateUrl: 'partials/world.html',
    controller: 'world',
    resolve: {
      lazy: ['$ocLazyLoad', function($ocLazyLoad) {
          return $ocLazyLoad.load({
              name: 'ricardo',
              files: [
                  'controllers/world.controller.js',
                  'directives/barChart.directive.js'
              ]
          })
      }],
      reportingEntities : function (apiService) {
        return apiService.getReportingEntities({'partners_ids': 'Worldbestguess'})
      },
      reportingWorldFlows : function (apiService) {
        return apiService.getWorldFlows()
      }
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


