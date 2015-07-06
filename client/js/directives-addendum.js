'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])
  
  .directive('bilateralTitle', [function(){
    return {
      restrict: 'E'
      ,template: '<h4>Trade reported by <inline-select ng-model="entities.sourceEntity.selected" list="reportingEntities"></inline-select> with <inline-select ng-model="entities.targetEntity.selected" list="reportingEntities"></inline-select> - {{minDate}} to {{maxDate}}</h4>'
    }
  }])

  .directive('dualTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="dual-timeline-container"></div>'
    }
  }])

  .directive('chartOfMissing', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="chart-of-missing-container"></div>'
    }
  }])

  .directive('inlineSelect', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelect.html'
      ,scope: {
        model: '=ngModel'
        ,list: '=list'
      }
    }
  }])