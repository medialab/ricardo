/*
 * Partner view Controller :
 */
angular.module("ricardo.controllers.partner", []).controller("partner", [
  "$scope",
  "$route",
  "$routeParams",
  "apiService",
  "partnerEntities",
  "LINE_CHART_CURRENCY",
  "LINE_CHART_FLOW_TYPES",
  function ($scope, $route, $routeParams, apiService, partnerEntities, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES) {
    $scope.view = "partner";
    $scope.loaded = false;

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
    $scope.partnersDict = $scope.partnersList.reduce((iter, partner) => ({ ...iter, [partner.id]: partner.label }), {});

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

    // Political statuses data:
    $scope.gphData = {};

    /**
     * ACTIONS:
     * ********
     */
    $scope.selectPartner = (partner) => {
      $scope.partner = partner;
      $scope.updateQueryParams();

      apiService
        .getFlows({
          partner_ids: $scope.partner,
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
      if (!$scope.selectedMinDate) $scope.selectedMinDate = -Infinity;
      if (!$scope.selectedMaxDate) $scope.selectedMaxDate = Infinity;

      // Check absolute extrema:
      $scope.selectedMinDate = Math.min(Math.max($scope.selectedMinDate, $scope.minDate), $scope.maxDate - 1);
      $scope.selectedMaxDate = Math.min(Math.max($scope.selectedMaxDate, $scope.minDate + 1), $scope.maxDate);

      // Check dates compared to each other:
      $scope.selectedMaxDate = Math.max($scope.selectedMaxDate, $scope.selectedMinDate + 1);

      // Reset available date ranges:
      $scope.minDateRange = d3.range($scope.minDate, $scope.selectedMaxDate);
      $scope.maxDateRange = d3.range($scope.selectedMinDate + 1, $scope.maxDate);

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
    apiService.getGeoPolHistData().then((data) => {
      $scope.gphData = data;
      $scope.selectPartner($scope.partner);
    });

    loadTradeComparison($scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES);
  },
]);

function loadTradeComparison($scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES) {
  /*
   * Init state
   */
  // Default color for the cuvers
  $scope.comparisonLineColors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c"];
  // list of selected partner
  $scope.comparison = [];
  // Data for the chart
  $scope.comparisonData = [];
  // Comparison currency
  $scope.comparisonCurrencyList = LINE_CHART_CURRENCY;
  $scope.comparisonCurrency = LINE_CHART_CURRENCY[0];
  // Comparison flow type
  $scope.comparisonFlowTypeList = LINE_CHART_FLOW_TYPES;
  $scope.comparisonFlowType = LINE_CHART_FLOW_TYPES[0];
  // Partner var for the inline-select
  $scope.comparisonPartnerEntity = {};

  /**
   * ACTIONS
   * ***************
   */
  // For the change on the inline-select
  $scope.comparisonPush = function (comparisonPartnerEntity) {
    if ($scope.comparison.length >= 5) return;
    if ($scope.comparison.findIndex((e) => e.id === comparisonPartnerEntity.id) === -1) {
      $scope.comparison.push(Object.assign(comparisonPartnerEntity, { color: $scope.comparisonLineColors.pop() }));
    }
    $scope.comparisonPartnerEntity = {};
  };

  // For the change on the inline-select
  $scope.comparisonRemove = function (comparisonPartnerEntity) {
    $scope.comparison = $scope.comparison.filter((e) => e.id !== comparisonPartnerEntity.id);
    $scope.comparisonLineColors.push(comparisonPartnerEntity.color);
  };

  $scope.comparisonReload = function () {
    $scope.comparisonData = null;
    Promise.all(
      $scope.comparison.map((entity) => {
        return apiService
          .getFlows({
            reporting_ids: entity.id,
            partner_ids: $scope.partner,
            with_sources: 1,
            from_year: $scope.selectedMinDate,
            to_year: $scope.selectedMaxDate,
          })
          .then((result) => {
            return {
              values: result.flows,
              color: entity.color,
              key: entity.id,
              flowType: $scope.comparisonFlowType.type.value,
            };
          });
      }),
    ).then((result) => {
      $scope.comparisonData = result;
    });
  };

  /**
   * WATCHERS
   * ***************
   */
  $scope.$watchCollection(
    "[partner, selectedMinDate, selectedMaxDate, comparison, comparisonCurrency, comparisonFlowType]",
    function (newVal, oldVal) {
      $scope.comparisonReload();
    },
  );
  $scope.$watch(
    "",
    function (newVal, oldVal) {
      $scope.comparisonReload();
    },
    true,
  );
}
