"use strict";

/* Controllers */

angular
  .module("ricardo.controllers.TranslateController", [])
  .controller("TranslateController", [
    "$translate",
    "$scope",
    function ($translate, $scope) {
      $scope.changeLanguage = function (langKey) {
        $translate.use(langKey);
      };
    },
  ]);
