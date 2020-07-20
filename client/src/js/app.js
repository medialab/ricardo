// Importing Angular
import angular from "angular";
import "./services.js";
import "./config.js";
import "./country.services.js";
import "./filters.js";
import "./controllers/index.js";
import "./directives/index.js";
// Style and JS deps
import "./external_dependencies";
import "./style";

/*
 * Declare app level module which depends on filters, and services
 */
angular
  .module("ricardo", [
    "ngRoute",
    "ngAnimate",
    "ngSanitize",
    "ui.bootstrap",
    "ui.grid",
    "ui.grid.pagination",
    "ui.select",
    "angular-loading-bar",
    "pascalprecht.translate",
    "angulartics",
    "angulartics.google.analytics",
    "ricardo.config",
    "ricardo.filters",
    "ricardo.controllers",
    "ricardo.services",
    "ricardo.services.country",
    "ricardo.directives",
  ])
  .run(function ($rootScope, $location, $anchorScroll, $timeout, cfpLoadingBar) {
    $rootScope.$on("$routeChangeStart", function () {
      cfpLoadingBar.start();
      // $rootScope.routeLoading=true;
    });
    $rootScope.$on("$routeChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
      cfpLoadingBar.complete();
      // $rootScope.routeLoading=false;
      $timeout(function () {
        if ($location.hash()) {
          $anchorScroll();
        }
      });
    });
  })
  .config([
    "$routeProvider",
    "$locationProvider",
    "DEFAULT_REPORTING",
    "DEFAULT_PARTNER",
    "DEFAULT_CONTINENT",
    "DEFAULT_FLOW_TYPE",
    function (
      $routeProvider,
      $locationProvider,
      DEFAULT_REPORTING,
      DEFAULT_PARTNER,
      DEFAULT_CONTINENT,
      DEFAULT_FLOW_TYPE,
    ) {
      $routeProvider.when("/", {
        templateUrl: "partials/home.html",
        controller: "home",
        resolve: {
          blogRSS: function (apiService) {
            return apiService.getBlogRSS();
          },
        },
      });
      $routeProvider.when("/bilateral", {
        redirectTo: function () {
          let entitySource = DEFAULT_REPORTING;
          if (localStorage.getItem("sourceEntitySelected")) {
            entitySource = JSON.parse(localStorage.getItem("sourceEntitySelected")).RICid;
          }
          return `/bilateral/${entitySource}`;
        },
      });
      $routeProvider.when("/bilateral/:entitySource/:entityTarget?", {
        templateUrl: "partials/bilateral.html",
        controller: "bilateral",
        resolve: {
          reportingEntities: function (apiService) {
            return apiService.getBilateralEntities();
          },
        },
      });
      $routeProvider.when("/country/:country", {
        templateUrl: "partials/country.html",
        controller: "country",
        resolve: {
          reportingEntities: function (apiService) {
            return apiService.getReportingEntities({
              type_filter: "country,group,city",
            });
          },
        },
      });
      $routeProvider.when("/country", {
        redirectTo: function () {
          let country = DEFAULT_REPORTING;
          if (localStorage.getItem("sourceEntitySelected")) {
            country = JSON.parse(localStorage.getItem("sourceEntitySelected")).RICid;
          }
          return `/country/${country}`;
        },
      });
      $routeProvider.when("/world", {
        templateUrl: "partials/world.html",
        controller: "world",
        resolve: {
          reportingWorldFlows: function (apiService) {
            return apiService.getWorldFlows();
          },
          reportingWorldPartner: function (apiService) {
            return apiService.getWorldAvailable();
          },
        },
      });
      $routeProvider.when("/network", {
        templateUrl: "partials/network.html",
        controller: "network",
        resolve: {
          reportingYears: function (apiService) {
            return apiService.getReportingYears();
          },
        },
      });
      $routeProvider.when("/metadata/:flowtype", {
        templateUrl: "partials/matrix.html",
        controller: "matrix",
      });
      $routeProvider.when("/metadata", {
        redirectTo: function () {
          return `/metadata/${DEFAULT_FLOW_TYPE}`;
        },
      });
      $routeProvider.when("/rates", {
        templateUrl: "partials/rates.html",
        controller: "rates",
      });
      $routeProvider.when("/glossary", {
        templateUrl: "partials/glossary.html",
      });
      $routeProvider.when("/corpus", {
        templateUrl: "partials/corpus.html",
      });
      $routeProvider.when("/about", {
        templateUrl: "partials/about.html",
      });
      $routeProvider.when("/legalNotice", {
        templateUrl: "partials/legalNotice.html",
      });
      $routeProvider.otherwise({ redirectTo: "/" });
    },
  ])
  .config([
    "cfpLoadingBarProvider",
    function (cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
      cfpLoadingBarProvider.includeBar = false;
    },
  ])
  .config(function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: "i18n/locale-",
      suffix: ".json",
    });
    var language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.userLanguage;

    if (language.indexOf("fr") > -1) language = "fr-FR";
    else language = "en-EN";
    $translateProvider.use(language);
  });
