/*
 * Partner view Controller :
 */
angular.module("ricardo.controllers.partner", []).controller("partner", [
  "$scope",
  "$route",
  "$routeParams",
  "apiService",
  "partnerEntities",
  "utils",
  "TABLE_HEADERS",
  "LINE_CHART_CURRENCY",
  "LINE_CHART_FLOW_TYPES",
  function (
    $scope,
    $route,
    $routeParams,
    apiService,
    partnerEntities,
    utils,
    TABLE_HEADERS,
    LINE_CHART_CURRENCY,
    LINE_CHART_FLOW_TYPES,
  ) {
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
          console.log($scope.flows);

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

    // Load the world trade comparison block
    loadTradeComparison($scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES);

    // Load the table component
    loadTableComponent($scope, TABLE_HEADERS);

    // Load the citation ref component
    loadCitationComponent($scope);
  },
]);

/**
 * Load & manage the world trade comparison chart.
 */
function loadTradeComparison($scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES) {
  /*
   * Init state
   * *****************
   */
  // Default color for the cuvers
  $scope.comparisonLineColors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c"];
  // list of selected reporter
  $scope.comparison = [];
  // Partner var for the inline-select
  $scope.comparisonReporterEntity = {};
  $scope.comparisonReporterList = [];
  // Data for the chart
  $scope.comparisonData = [];
  // Comparison currency
  $scope.comparisonCurrency = LINE_CHART_CURRENCY[0];
  // Comparison flow type
  $scope.comparisonFlowTypeList = LINE_CHART_FLOW_TYPES;
  $scope.comparisonFlowType = LINE_CHART_FLOW_TYPES[0];

  /**
   * ACTIONS
   * ***************
   */
  // For the change on the inline-select
  $scope.comparisonPush = function (comparisonReporterEntity) {
    if ($scope.comparison.length >= 5) return;
    if ($scope.comparison.findIndex((e) => e.id === comparisonReporterEntity.id) === -1) {
      $scope.comparison.push(Object.assign(comparisonReporterEntity, { color: $scope.comparisonLineColors.pop() }));
    }
    $scope.comparisonReporterEntity = {};
  };

  // For the change on the inline-select
  $scope.comparisonRemove = function (comparisonReporterEntity) {
    $scope.comparison = $scope.comparison.filter((e) => e.id !== comparisonReporterEntity.id);
    $scope.comparisonLineColors.push(comparisonReporterEntity.color);
  };

  /**
   * Main function that handle the recomptation of the chart
   */
  $scope.comparisonReload = function (flows, minDate, maxDate, comparison, flowType) {
    // Compute reporter list
    if (flows)
      $scope.comparisonReporterList = $scope.flows
        .map((flow) => {
          return { id: flow.reporting_id, label: flow.reporting_name };
        })
        .filter((value, index, self) => self.findIndex((e) => e.id === value.id) === index)
        .sort((a, b) => (a.label.toUpperCase() < b.label.toUpperCase() ? -1 : 1));

    // Compute comparison data
    $scope.comparisonData = null;
    $scope.comparisonData = comparison.map((entity) => {
      return {
        color: entity.color,
        key: entity.id,
        flowType: flowType.type.value,
        values: flows.filter((flow) => {
          if (flow.reporting_id === entity.id && minDate <= flow.year <= maxDate) {
            return true;
          } else {
            return false;
          }
        }),
      };
    });
  };

  /**
   * WATCHERS
   * ***************
   */
  $scope.$watch(
    "comparison",
    function (newVal, oldVal) {
      $scope.comparisonReload(
        $scope.flows,
        $scope.selectedMinDate,
        $scope.selectedMaxDate,
        newVal,
        $scope.comparisonFlowType,
      );
    },
    true,
  );
  $scope.$watchCollection("[partner, selectedMinDate, selectedMaxDate, flows, comparisonFlowType]", function (
    newVal,
    oldVal,
  ) {
    $scope.comparisonReload(newVal[3], newVal[1], newVal[2], $scope.comparison, newVal[4]);
  });
}

/**
 * Load & manage the table component
 */
function loadTableComponent($scope, TABLE_HEADERS) {
  $scope.tableDisplay = false;
  $scope.gridOptions = {
    data: "flows",
    paginationPageSizes: [50],
    paginationPageSize: 50,
    columnDefs: TABLE_HEADERS,
    columnFooterHeight: 45,
    enableHorizontalScrollbar: 2,
    enableVerticalScrollbar: 1,
  };
  $scope.tableDownloadCSV = function () {
    utils.downloadCSV(
      $scope.flows,
      TABLE_HEADERS.map((h) => h.displayName),
      TABLE_HEADERS.map((h) => h.field),
      `RICardo - partner - ${$scope.partner} - ${$scope.selectedMinDate} - ${$scope.selectedMaDate}`,
    );
  };
  $scope.tableDownloadCSVOrginalCurrency = function () {
    apiService
      .getFlows({
        partner_ids: $scope.partner,
        with_sources: 1,
        original_currency: 1,
      })
      .then(function (result) {
        utils.downloadCSV(
          $scope.flows,
          TABLE_HEADERS.map((h) => h.displayName),
          TABLE_HEADERS.map((h) => h.field),
          `RICardo - partner - ${$scope.partner} - ${$scope.selectedMinDate} - ${$scope.selectedMaDate} - Original currency`,
        );
      });
  };
}

function loadCitationComponent($scope) {
  $scope.citationData = null;
  $scope.$watch("flows", function (newVal, oldVal) {
    if (newVal) {
      let dataAsMap = newVal
        .map((flow) => {
          return { year: flow.year, nb_reporting: 1 };
        })
        .reduce((acc, current) => {
          acc[current.year] = (acc[current.year] || 0) + 1;
          return acc;
        }, {});

      $scope.citationData = Object.keys(dataAsMap).map((key) => {
        return { year: +key, nb_reporting: dataAsMap[key] };
      });
    }
  });
}
