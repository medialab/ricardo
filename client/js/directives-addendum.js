'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])

  .directive('bilateralTitle', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/bilateralTitle.html'
    }
  }])

  .directive('countryTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/countryTitle.html'
    }
  }])

  .directive('dualTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="dual-timeline-container"></div>'
    }
  }])

  .directive('brushingTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="brushing-timeline-container"></div>'
    }
  }])

  .directive('chartOfMissing', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="chart-of-missing-container"></div>'
    }
  }])

  .directive('inlineSelectCountry', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectCountry.html'
      ,scope: {
        model: '=ngModel'
        ,list: '=list'
      }
    }
  }])

  .directive('inlineSelectYear', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectYear.html'
      ,scope: {
        model: '=ngModel'
        ,list: '=list'
      }
    }
  }])
