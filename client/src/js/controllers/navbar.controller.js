angular.module("ricardo.controllers.navbar", []).controller("navbar", [
  "$scope",
  "$location",
  function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      return $location.path().indexOf(viewLocation) === 0;
    };
    $scope.views = [
      { slug: "world", label: "World" },
      { slug: "reporting", label: "Reporting" },
      { slug: "partner", label: "Partner" },
      { slug: "bilateral", label: "Bilateral" },
    ];
    $scope.dataViews = [
      { slug: "glossary", label: "Glossary" },
      { slug: "metadata", label: "MetaData" },
      { slug: "rates", label: "Exchange rates" },
      { slug: "corpus", label: "Corpus" },
    ];
  },
]);
