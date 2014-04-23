'use strict';

/* Controllers */

angular.module('ricardo.controllers', [])
  .controller('hello', function($scope, $window, $location, fileService) {

    $scope.info = {
      subtitle: "Historical Trade Database"
    }

  })
