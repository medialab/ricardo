'use strict';

/* Controllers */

angular.module('ricardo.controllers.navbar', [])
  .controller('navbar', [ "$scope", "$location", function($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
    $scope.views = [
      {slug: "world", label: "World view"},
      {slug: "country", label: "Country view"},
      {slug: "bilateral", label: "Bilateral view"}
      //{slug:"RICentities", label:"RICentities view"}
    ]
  }])