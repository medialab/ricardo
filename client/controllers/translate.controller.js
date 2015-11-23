'use strict';

/* Controllers */

angular.module('ricardo.controllers.TranslateController', [])
  .controller('TranslateController', function($translate, $scope) {
    $scope.changeLanguage = function (langKey) {
      $translate.use(langKey);
    };
  })