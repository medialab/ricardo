"use strict";

/* Directives */

angular
  .module("ricardo.directives.worldTitle", [])

  /* directive with only template */
  .directive("worldTitle", [
    function () {
      return {
        restrict: "E",
        templateUrl: "partials/worldTitle.html",
      };
    },
  ]);
