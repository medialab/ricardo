/*
 * Partner view Controller :
 */
angular.module("ricardo.controllers.partner", []).controller("partner", [
  "$scope",
  "$route",
  "$routeParams",
  "apiService",
  "partnerEntities",
  function ($scope, $route, $routeParams, apiService, partnerEntities) {
    $scope.view = "partner";
    $scope.loaded = false;

    console.log("PARTNERS LIST", partnerEntities);

    /**
     * INITIAL STATE:
     * **************
     */
    // The selected partner ID:
    $scope.partner = $routeParams.partner;
    // The list of all available partners full data objects:
    $scope.partnersList = partnerEntities.map((ricEntry) => ({
      id: ricEntry.RICid,
      label: ricEntry.RICname,
      type: ricEntry.type,
    }));
    // A dictionary of partner labels, indexed by IDs:
    $scope.partnersDict = {};

    // The extrema years range (only depends on the data):
    $scope.minDate = null;
    $scope.maxDate = null;
    // The currently selected years range (bound to params later in the code):
    $scope.selectedMinDate = $route.current.params.selectedMinDate;
    $scope.selectedMaxDate = $route.current.params.selectedMaxDate;
    // The years values lists:
    $scope.minDateRange = [];
    $scope.maxDateRange = [];

    // Flows data for charts:
    $scope.flows = null;

    /**
     * ACTIONS:
     * ********
     */
    $scope.selectPartner = (partner) => {
console.log("SELECT PARTNER", partner);
      $scope.partner = partner;
      $scope.updateQueryParams();

      apiService
        .getFlows({
          reporting_ids: $scope.partner,
          with_sources: 1,
        })
        .then((data) => {
          $scope.flows = data.flows;

          const dates = $scope.flows.map((d) => d.year);
          $scope.minDate = d3.min(dates);
          $scope.maxDate = d3.max(dates);

          $scope.selectDates();
        });
    };

    $scope.selectDates = (state = {}) => {
      if ("selectedMinDate" in state) $scope.selectedMinDate = state.selectedMinDate;
      if ("selectedMaxDate" in state) $scope.selectedMaxDate = state.selectedMaxDate;

      // Set initial values if missing:
      if (!$scope.selectedMinDate) $scope.selectedMinDate = Infinity;
      if (!$scope.selectedMaxDate) $scope.selectedMaxDate = -Infinity;

      // Check absolute extrema:
      $scope.selectedMinDate = Math.min(Math.max($scope.selectedMinDate, $scope.minDate), $scope.maxDate - 1);
      $scope.selectedMaxDate = Math.min(Math.max($scope.selectedMaxDate, $scope.minDate + 1), $scope.maxDate);

      // Check dates compared to each other:
      $scope.selectedMaxDate = Math.max($scope.selectedMaxDate, $scope.selectedMinDate + 1);

      // Reset available date ranges:
      $scope.minDateRange = d3.range($scope.minDate, $scope.selectedMaxDate);
      $scope.maxDateRange = d3.range($scope.selectedMinDate + 1, $scope.maxDate);

      console.log(
        "DATES",
        $scope.selectedMinDate,
        $scope.selectedMaxDate,
        $scope.minDate,
        $scope.maxDate,
        $scope.minDateRange,
        $scope.maxDateRange,
      );

      $scope.updateQueryParams();
    };
    $scope.selectMinDate = (selectedMinDate) => $scope.selectDates({ selectedMinDate });
    $scope.selectMaxDate = (selectedMaxDate) => $scope.selectDates({ selectedMaxDate });

    $scope.updateQueryParams = () => {
      $route.updateParams({
        partner: $scope.partner,
        selectedMinDate: $scope.selectedMinDate,
        selectedMaxDate: $scope.selectedMaxDate,
      });
    };

    /**
     * INITIALISATION:
     * ***************
     */
    $scope.selectPartner($scope.partner);
  },
]);
