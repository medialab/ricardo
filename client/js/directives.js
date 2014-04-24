'use strict';

/* Directives */


angular.module('ricardo.directives', [])
  .directive('navbar',[ 'fileService', '$timeout', function (fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

      }
    }
  }])
  .directive('timeline',[ 'fileService', '$timeout', function (fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      //templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

      }
    }
  }])
