'use strict';

/* Controllers */

angular.module('ricardo.controllers.footer', [])
  .controller('footer', [ "$scope", "$location", function($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
    $scope.views = [
      {slug: "legalNotice", label: "Legale Notice"}
    ]
  }])
