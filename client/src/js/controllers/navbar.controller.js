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
      { slug: "metadata", label: "MetaData" },
      { slug: "exchange_rates", label: "Exchange rates" },
      { slug: "corpus", label: "Corpus" },
    ];
    $scope.glossary = [
      { slug: "entities_glossary", label: "Entities" },
      { slug: "trade_glossary", label: "Trade" },
      { slug: "sources_glossary", label: "Sources" },
      { slug: "exchange_rates_glossary", label: "Exchange rates" },
    ];
  },
]);
