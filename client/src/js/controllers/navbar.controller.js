angular.module("ricardo.controllers.navbar", []).controller("navbar", [
  "$scope",
  "$location",
  function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      return viewLocation === $location.path();
    };
    $scope.views = [
      { slug: "world", label: "World" },
      { slug: "country", label: "Country" },
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
