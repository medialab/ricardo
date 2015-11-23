'use strict';

/* Directives */

angular.module('ricardo.directives.inlineSelectCurrency', [])

  /* directive with only template */
  .directive('inlineSelectCurrency', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectCurrency.html'
      ,scope: {
          model: '=ngModel'
        , list: '=list'
      }
    }
  }])