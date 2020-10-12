angular.module("ricardo.controllers.home", []).controller("home", [
  "$scope",
  "blogRSS",
  function ($scope, blogRSS) {
    $scope.articles = blogRSS;
  },
]);
