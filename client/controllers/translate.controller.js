'use strict';

/* Controllers */

angular.module('ricardo.controllers.TranslateController', [])
  .controller('TranslateController', function($translate, $scope) {
    $scope.changeLanguage = function (langKey) {
    	console.log("langKey", langKey);
      $translate.use(langKey);
    };
  })