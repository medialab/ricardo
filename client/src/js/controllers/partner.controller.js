import { initParams, getListItemId } from "../utils";

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
    loadTradeComparison($route, $scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES);

    // Load the table component
    loadTableComponent($scope, TABLE_HEADERS);

    // Load the citation ref component
    loadCitationComponent($scope);

    // Load the reporting heatmap  component
    loadReportingHeatMapComponent($scope);

    // sync url params
    initParams($route, $scope, [
      { name: "selectedMinDate" },
      { name: "selectedMaxDate" },
      { name: "comparisonFlowType", list: LINE_CHART_FLOW_TYPES, getItemId: getListItemId },
      { name: "heatmapOrder", list: $scope.heatmapOrderList },
      { name: "heatmapField", list: $scope.heatmapFieldList, getItemId: (a) => a.id },
    ]);
  },
]);

/**
 * Load & manage the world trade comparison chart.
 */
function loadTradeComparison($route, $scope, apiService, LINE_CHART_CURRENCY, LINE_CHART_FLOW_TYPES) {
  /*
   * Init state
   * *****************
   */
  // Default color for the cuvers
  $scope.comparisonLineColors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c"];
  // list of selected reporter
  $scope.comparison = null;
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
    if ($scope.comparison && $scope.comparison.length >= 5) return;
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
   * Main function that handle the recomputation of the chart
   */
  $scope.comparisonReload = function (flows, minDate, maxDate, comparison, flowType) {
    // Compute reporter list
    if (flows) {
      $scope.comparisonReporterList = flows
        .map((flow) => {
          return { id: flow.reporting_id, label: flow.reporting_name };
        })
        .filter((value, index, self) => self.findIndex((e) => e.id === value.id) === index)
        .sort((a, b) => (a.label.toUpperCase() < b.label.toUpperCase() ? -1 : 1));

      // it's the init
      if (!comparison) {
        if ($route.current.params["comparison"]) {
          $scope.comparison = [];
          $route.current.params["comparison"].split("|").forEach((id) => {
            let item = $scope.comparisonReporterList.find((e) => e.id === id);
            if (item) {
              $scope.comparisonPush(item);
            }
            comparison = $scope.comparison;
          });
        } else {
          comparison = [];
          $scope.comparison = comparison;
        }
      }
    }

    // Compute comparison data
    if (comparison) {
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
    }
  };

  /**
   * WATCHERS
   * ***************
   */
  $scope.$watchCollection("[partner, selectedMinDate, selectedMaxDate, flows, comparisonFlowType]", function (
    newVal,
    oldVal,
  ) {
    $scope.comparisonReload(newVal[3], newVal[1], newVal[2], $scope.comparison, newVal[4]);
  });
  $scope.$watch(
    "comparison",
    function (newVal, oldVal) {
      // update the chart
      $scope.comparisonReload(
        $scope.flows,
        $scope.selectedMinDate,
        $scope.selectedMaxDate,
        newVal,
        $scope.comparisonFlowType,
      );
      // update params
      let urlParams = Object.assign({}, $route.current.params);
      if (newVal) {
        urlParams.comparison = newVal.map((e) => e.id).join("|");
      } else {
        delete urlParams.comparison;
      }

      $route.updateParams(urlParams);
    },
    true,
  );
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

/**
 * Load & manage the citation component.
 */
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

/**
 * Load & manage the heatmap component..
 */
function loadReportingHeatMapComponent($scope) {
  $scope.heatmapDataSource = null; // Array<{id:string, label:string, total:{total:number, exp:number, imp:number}, data:{[year:number]:{total:number, imp:number, exp:number, currency}}}>
  $scope.heatmapData = null; // Array<{id:string, label:string, tooltip:(data, min, max):string, data:{[year:number]:number}}>
  $scope.heatmapReporterList = null;
  $scope.heatmapOrder = null;
  $scope.heatmapLegend = false;
  $scope.heatmapOpacity = true;
  $scope.heatmapOrderList = ["Name", "First year", "Number of years", "Average trade volume"];
  $scope.heatmapOrder = $scope.heatmapOrderList[0];
  $scope.heatmapFieldList = [
    { id: "total", label: "Total" },
    { id: "imp", label: "Import" },
    { id: "exp", label: "Export" },
  ];
  $scope.heatmapField = $scope.heatmapFieldList[0];
  $scope.heatmapShowAll = false;
  $scope.heatmapShowAllToggle = function () {
    $scope.heatmapShowAll = !$scope.heatmapShowAll;
  };
  $scope.heatmapColors = ["#f9b702", "#f46a00", "#f90202"];
  $scope.heatmapQuantile = { total: [0, 0], imp: [0, 0], exp: [0, 0] };
  $scope.heatmapGetColorsViaQuantile = function (values, field) {
    let color = $scope.heatmapColors[2];
    if (values[field] < $scope.heatmapQuantile[field][1]) {
      color = $scope.heatmapColors[1];
    }
    if (values[field] < $scope.heatmapQuantile[field][0]) {
      color = $scope.heatmapColors[0];
    }
    return color;
  };

  /**
   * Given the data computed and the order + field ,
   * this function transform it to valid format for the heatmap directive.
   */
  $scope.heatmapDataTransform = function (data, order, field) {
    let result = angular.copy(data);
    if (data && order && field) {
      // Make the transfo for the field
      result = result.map((reporter) => {
        const reporterData = angular.copy(reporter.data);
        Object.keys(reporterData).forEach((year) => {
          if (reporterData[year][field.id]) reporterData[year] = reporterData[year][field.id];
          else reporterData[year] = 0;
        });
        return {
          id: reporter.key,
          label: reporter.label,
          color: $scope.heatmapGetColorsViaQuantile(reporter.average, field.id),
          average: reporter.average[field.id], // used for the order
          data: reporterData,
          tooltip: (data, min, max) => {
            return `
              <h3>${reporter.label} - ${data.year}</h3>
              <ul>
                <li><strong>Total :</strong> ${Math.round(reporter.data[data.year].total)}</li>
                <li><strong>Import :</strong> ${Math.round(reporter.data[data.year].imp)} </li>
                <li><strong>Export :</strong> ${Math.round(reporter.data[data.year].exp)}</li>
              </ul>
              <span>Values are in <strong>${reporter.data[data.year].currency}</strong></span>`;
          },
        };
      });

      // Make the order
      let getValueForOrdering = (a) => a.label.toUpperCase();
      switch (order) {
        case $scope.heatmapOrderList[1]:
          getValueForOrdering = (a) => Object.keys(a.data)[0];
          break;
        case $scope.heatmapOrderList[2]:
          getValueForOrdering = (a) => Object.keys(a.data).length * -1;
          break;
        case $scope.heatmapOrderList[3]:
          getValueForOrdering = (a) => a.average * -1;
          break;
      }
      result.sort((a, b) => (getValueForOrdering(a) < getValueForOrdering(b) ? -1 : 1));
    }
    return result;
  };

  $scope.$watch("flows", function (newVal, oldVal) {
    if (newVal) {
      // Recompute reporterlist
      let reporterMap = newVal
        .map((flow) => {
          return { id: flow.reporting_id, name: flow.reporting_name };
        })
        .reduce((acc, current) => {
          acc[current.id] = current.name;
          return acc;
        }, {});
      $scope.heatmapReporterList = Object.keys(reporterMap).map((key) => {
        return { RICid: key, RICname: reporterMap[key] };
      });

      // Recompute data
      $scope.heatmapDataSource = Object.keys(reporterMap).map((key) => {
        const filterFlows = newVal.filter((flow) => flow.reporting_id === key && flow.total);
        return {
          id: key,
          label: reporterMap[key],
          average: filterFlows.reduce(
            (acc, current, index, source) => {
              //we compute the total till the last line
              acc.total += current.total || 0;
              acc.imp += current.imp || 0;
              acc.exp += current.exp || 0;
              // if we are at the end, we divide per the legnth to have the average
              if (index === source.length - 1) {
                acc.total = acc.total / source.length;
                acc.imp = acc.imp / source.length;
                acc.exp = acc.exp / source.length;
              }
              return acc;
            },
            { total: 0, exp: 0, imp: 0 },
          ),
          data: filterFlows.reduce((acc, current) => {
            if (acc[current.year]) {
              acc[current.year] = {
                currency: current.currency,
                exp: (current.exp || 0) + acc[current.year].exp,
                imp: (current.imp || 0) + acc[current.year].imp,
                total: (current.total || 0) + acc[current.year].total,
              };
            } else {
              acc[current.year] = {
                currency: current.currency,
                exp: current.exp || 0,
                imp: current.imp || 0,
                total: current.total || 0,
              };
            }
            return acc;
          }, {}),
        };
      });

      const reportingAverageTotal = $scope.heatmapDataSource
        .map((e) => e.average.total)
        .sort((a, b) => (a < b ? -1 : 1));
      const reportingAverageImp = $scope.heatmapDataSource.map((e) => e.average.imp).sort((a, b) => (a < b ? -1 : 1));
      const reportingAverageExp = $scope.heatmapDataSource.map((e) => e.average.exp).sort((a, b) => (a < b ? -1 : 1));
      $scope.heatmapQuantile = {
        total: [d3.quantile(reportingAverageTotal, 0.33), d3.quantile(reportingAverageTotal, 0.66)],
        exp: [d3.quantile(reportingAverageExp, 0.33), d3.quantile(reportingAverageExp, 0.66)],
        imp: [d3.quantile(reportingAverageImp, 0.33), d3.quantile(reportingAverageImp, 0.66)],
      };

      $scope.heatmapData = $scope.heatmapDataTransform(
        $scope.heatmapDataSource,
        $scope.heatmapOrder,
        $scope.heatmapField,
      );
    }
  });

  $scope.$watchCollection("[heatmapOrder, heatmapField]", function (newValue, oldValue) {
    $scope.heatmapData = $scope.heatmapDataTransform($scope.heatmapDataSource, newValue[0], newValue[1]);
  });
}
