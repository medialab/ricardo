'use strict';

/* Controllers */

angular.module('ricardo.controllers', [])
  .controller('navbar', function($scope, $location) {

  	$scope.isActive = function (viewLocation) { 
        return viewLocation === $location.path();
    };
    
    $scope.views = [
      {slug:"bilateral", label:"Bilateral view"},
      {slug:"country", label:"Country view"},
      {slug:"world", label:"World view"},
      {slug:"timeline", label:"Timeline view"},
      {slug:"federation", label:"Federation view"},
    ]

  })
  .controller('bilateral', function($scope, $location) {

  })
  .controller('country', function($scope, $location) {

  })
  .controller('world', function($scope, $location) {

  })
  .controller('timeline', function($scope, $location) {

  })
  .controller('federation', function($scope, $location) {

  })