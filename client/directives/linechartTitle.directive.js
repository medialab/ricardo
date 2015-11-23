 'use strict';

/* Directives */

angular.module('ricardo.directives.linechartTitle', [])
  /* directive with only template */
  .directive('linechartTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/linechartTitle.html'
    }
  }])