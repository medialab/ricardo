"use strict";

/* Directives */

angular
  .module("ricardo.directives.inlineSelectCtrl", [])

  /* directive with only template */
  .directive("inlineSelectCtrl", [
    function () {
      return {
        restrict: "E",
        templateUrl: "partials/inlineSelectCtrl.html",
        scope: {
          model: "=ngModel",
          list: "=list",
        },
      };
    },
  ]);
