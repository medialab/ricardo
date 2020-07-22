/* Directives */
angular
  .module("ricardo.directives.navbar", [])

  .directive("navbar", [
    function () {
      return {
        restrict: "A",
        replace: false,
        templateUrl: "partials/navbar.html",
        link: function (scope, element, attrs) {},
      };
    },
  ]);
