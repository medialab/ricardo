// Importing Angular
import angular from "angular";
import "./services.js";
import "./config.js";
import "./reporting.services.js";
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
    "angulartics.piwik",
    "ricardo.config",
    "ricardo.filters",
    "ricardo.controllers",
    "ricardo.services",
    "ricardo.services.reporting",
    "ricardo.directives",
  ])
  .run([
    "$rootScope",
    "$location",
    "$anchorScroll",
    "$timeout",
    "cfpLoadingBar",
    function ($rootScope, $location, $anchorScroll, $timeout, cfpLoadingBar) {
      $rootScope.$on("$routeChangeStart", function () {
        cfpLoadingBar.start();
      });
      $rootScope.$on("$routeChangeSuccess", function () {
        cfpLoadingBar.complete();
        $timeout(function () {
          if ($location.hash()) {
            $anchorScroll();
          }
        });
      });
      $rootScope.$on("$routeChangeError ", function (e) {
        cfpLoadingBar.complete();
      });
    },
  ])
  .config([
    "$routeProvider",
    "$locationProvider",
    "DEFAULT_REPORTING",
    "DEFAULT_PARTNER",
    "DEFAULT_CONTINENT",
    "DEFAULT_FLOW_TYPE",
    "DEFAULT_CURRENCY",
    function (
      $routeProvider,
      $locationProvider,
      DEFAULT_REPORTING,
      DEFAULT_PARTNER,
      DEFAULT_CONTINENT,
      DEFAULT_FLOW_TYPE,
      DEFAULT_CURRENCY,
    ) {
      $routeProvider.when("/", {
        templateUrl: "partials/home.html",
        controller: "home",
        resolve: {
          blogRSS: [
            "apiService",
            function (apiService) {
              return apiService.getBlogRSS();
            },
          ],
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
        reloadOnUrl: true,
        reloadOnSearch: false,
        resolve: {
          reportingEntities: [
            "apiService",
            function (apiService) {
              return apiService.getBilateralEntities();
            },
          ],
        },
      });
      $routeProvider.when("/reporting/:reporting", {
        templateUrl: "partials/reporting.html",
        controller: "reporting",
        reloadOnUrl: true,
        reloadOnSearch: false,
        resolve: {
          reportingEntities: [
            "apiService",
            function (apiService) {
              return apiService.getReportingEntities({
                type_filter: "GPH_entity,group,city",
              });
            },
          ],
        },
      });
      $routeProvider.when("/reporting", {
        redirectTo: function () {
          let reporting = DEFAULT_REPORTING;
          if (localStorage.getItem("sourceEntitySelected")) {
            reporting = JSON.parse(localStorage.getItem("sourceEntitySelected")).RICid;
          }
          return `/reporting/${reporting}`;
        },
      });
      $routeProvider.when("/country", {
        redirectTo: function () {
          return `/reporting`;
        },
      });
      $routeProvider.when("/partner/:partner", {
        templateUrl: "partials/partner.html",
        controller: "partner",
        reloadOnUrl: false,
        reloadOnSearch: false,
        resolve: {
          partnerEntities: [
            "apiService",
            function (apiService) {
              return apiService.getPartnerEntities({
                type_filter: "GPH_entity,group,city",
              });
            },
          ],
        },
      });
      $routeProvider.when("/partner", {
        redirectTo: function () {
          const partner = localStorage.getItem("latestSelectedPartner") || DEFAULT_PARTNER;
          return `/partner/${partner}`;
        },
      });
      $routeProvider.when("/world", {
        templateUrl: "partials/world.html",
        controller: "world",
        reloadOnUrl: true,
        reloadOnSearch: false,
        resolve: {
          reportingWorldFlows: [
            "apiService",
            function (apiService) {
              return apiService.getWorldFlows();
            },
          ],
          reportingWorldPartner: [
            "apiService",
            function (apiService) {
              return apiService.getWorldAvailable();
            },
          ],
        },
      });
      $routeProvider.when("/network", {
        templateUrl: "partials/network.html",
        controller: "network",
        resolve: {
          reportingYears: [
            "apiService",
            function (apiService) {
              return apiService.getReportingYears();
            },
          ],
        },
      });
      $routeProvider.when("/metadata/:flowtype", {
        templateUrl: "partials/metadata.html",
        controller: "metadata",
        reloadOnUrl: true,
        reloadOnSearch: false,
      });
      $routeProvider.when("/metadata", {
        redirectTo: function () {
          return `/metadata/${DEFAULT_FLOW_TYPE}`;
        },
      });
      $routeProvider.when("/exchange_rates/:currency", {
        templateUrl: "partials/rates.html",
        controller: "rates",
        reloadOnUrl: false,
        reloadOnSearch: false,
      });
      $routeProvider.when("/exchange_rates", {
        redirectTo: function () {
          return `/exchange_rates/${DEFAULT_CURRENCY}`;
        },
      });
      $routeProvider.when("/entities_glossary", {
        templateUrl: "partials/entities_glossary.html",
      });
      $routeProvider.when("/sources_glossary", {
        templateUrl: "partials/sources_glossary.html",
      });
      $routeProvider.when("/trade_glossary", {
        templateUrl: "partials/trade_glossary.html",
      });
      $routeProvider.when("/exchange_rates_glossary", {
        templateUrl: "partials/exchange_rates_glossary.html",
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
  .config([
    "$translateProvider",
    function ($translateProvider) {
      $translateProvider.useStaticFilesLoader({
        prefix: "i18n/locale-",
        suffix: ".json",
      });
      var language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.userLanguage;

      if (language.indexOf("fr") > -1) language = "fr-FR";
      else language = "en-EN";
      $translateProvider.use(language);
    },
  ]);
