'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])

  .directive('dualTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="dual-timeline-container"></div>'
    }
  }])