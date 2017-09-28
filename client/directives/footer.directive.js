'use strict';

/* Directives */

angular.module('ricardo.directives.footer', [])

  .directive('footer',[ 'fileService', '$timeout', function (fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'partials/footer.html',
      link: function(scope, element, attrs) {
      }
    }
  }])
