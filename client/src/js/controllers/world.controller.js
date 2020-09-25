import { initParams, getListItemId } from "../utils";

angular.module("ricardo.controllers.world", []).controller("world", [
  "$scope",
  "$route",
  "apiService",
  "utils",
  "reportingWorldFlows",
  "reportingWorldPartner",
  "WORLD_TABLE_HEADERS",
  function ($scope, $route, apiService, utils, reportingWorldFlows, reportingWorldPartner, WORLD_TABLE_HEADERS) {
    // data process for multilinechart
    initWorldMultiChart(reportingWorldPartner);

    $scope.worldFlows = reportingWorldFlows;

    $scope.entities = {
      sourceEntity: {},
      sourceCountryEntity: {},
      sourceColonialEntity: {},
      sourceGeoEntity: {},
      sourceContinentEntity: {},
      sourceWorldEntity: {},
    };

    $scope.currency = 0;
    $scope.actualCurrency = "pound sterling";
    $scope.RICentities = {};
    $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function (a, b) {
      if (a.RICname < b.RICname) return -1;
      if (a.RICname > b.RICname) return 1;
      return 0;
    });

    $scope.reporting = [];
    $scope.reportingCountryEntities = [];
    $scope.missingData = [];
    $scope.viewTable = 0;
    $scope.lineColors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c"];

    $scope.view = "world";
    $scope.tableData = [
      {
        reporting_id: null,
        type: null,
        partner_id: null,
        year: null,
        imp: null,
        exp: null,
        total: null,
        currency: null,
        sources: null,
      },
    ]; // to show table under linechart World

    $scope.rawYearsRange;
    $scope.rawYearsRange_forInf;
    $scope.rawYearsRange_forSup;

    /*
     * Config dropdownlist of multiline chart
     */
    $scope.multichartLayoutChoices = [
      {
        type: { value: "multiple", writable: true },
        name: { value: "Multiple View", writable: true },
      },
      {
        type: { value: "single", writable: true },
        name: { value: "Single View", writable: true },
      },
    ];
    $scope.multichartLayout = $scope.multichartLayoutChoices[0];

    $scope.multiFlowChoices = [
      {
        type: { value: "total", writable: true },
        name: { value: "Total", writable: true },
      },
      {
        type: { value: "Exp", writable: true },
        name: { value: "Exports", writable: true },
      },
      {
        type: { value: "Imp", writable: true },
        name: { value: "Imports", writable: true },
      },
    ];
    $scope.multichartFlow = $scope.multiFlowChoices[0];
    $scope.worldPartnerChoices = [
      {
        type: { value: "Worldbestguess", writable: true },
        name: { value: "World best guess", writable: true },
      },
      {
        type: { value: "Worldasreported", writable: true },
        name: { value: "World as reported", writable: true },
      },
      {
        type: { value: "Worldsumpartners", writable: true },
        name: { value: "World sum partners", writable: true },
      },
      {
        type: { value: "WorldFedericoTena", writable: true },
        name: { value: "World Federico Tena", writable: true },
      },
    ];
    $scope.worldPartner = $scope.worldPartnerChoices[0];

    /*
     * Config buttons of linechart
     */
    $scope.linechartCurrencyChoices = [
      {
        type: { value: "sterling", writable: true },
        name: { value: "Sterling", writable: true },
      },
      {
        type: { value: "value", writable: true },
        name: { value: "Percent", writable: true },
      },
    ];
    $scope.linechartCurrency = $scope.linechartCurrencyChoices[0];

    $scope.linechartFlowChoices = [
      {
        type: { value: "total", writable: true },
        name: { value: "Total", writable: true },
      },
      {
        type: { value: "exp", writable: true },
        name: { value: "Exports", writable: true },
      },
      {
        type: { value: "imp", writable: true },
        name: { value: "Imports", writable: true },
      },
    ];
    $scope.linechartFlow = $scope.linechartFlowChoices[0];

    $scope.nbReportingTooltip = function (data) {
      return `
        <h3>${data.year}</h3>
        <ul>
          <li><strong>Number of entities :</strong> ${data.nb_reporting}</li>
        </ul>`;
    };

    initParams($route, $scope, [
      {
        name: "multichartLayout",
        list: $scope.multichartLayoutChoices,
        getItemId: getListItemId,
      },
      {
        name: "multichartFlow",
        list: $scope.multiFlowChoices,
        getItemId: getListItemId,
      },
      {
        name: "selectedMinDate",
      },
      {
        name: "selectedMaxDate",
      },
      {
        name: "worldPartner",
        list: $scope.worldPartnerChoices,
        getItemId: getListItemId,
      },
      {
        name: "linechartCurrency",
        list: $scope.linechartCurrencyChoices,
        getItemId: getListItemId,
      },
      {
        name: "linechartFlow",
        list: $scope.linechartFlowChoices,
        getItemId: getListItemId,
      },
    ]);

    var worldFlowsYearsFormat, worldFlows_filtered;

    $scope.changeWorldPartner = function (worldPartner) {
      $scope.worldPartner = worldPartner;
      worldFlows_filtered = reportingWorldFlows.filter(function (d) {
        return d.partner === worldPartner.type.value;
      });
      $scope.nbReportings = worldFlows_filtered;
      var worldFlowsYears = d3
        .nest()
        .key(function (d) {
          return d.year;
        })
        .entries(worldFlows_filtered);
      worldFlowsYearsFormat = [];
      worldFlowsYears.forEach(function (d) {
        if (d.key) {
          var exp = d.values.filter(function (e) {
            return e.type === "Exp";
          })[0];
          var imp = d.values.filter(function (e) {
            return e.type === "Imp";
          })[0];
          var sources = [
            exp ? exp.sources : null,
            imp ? (imp.sources != (exp ? exp.sources : null) ? imp.sources : null) : null,
          ].filter(function (e) {
            return e;
          });
          worldFlowsYearsFormat.push({
            reporting_id: null,
            type: null,
            partner_id: d.values[0].partner,
            year: d.key,
            imp: imp ? imp.flows : null,
            exp: exp ? exp.flows : null,
            total: (imp ? imp.flows : 0) + (exp ? exp.flows : 0),
            currency: "sterling",
            sources: sources.join(", "),
          });
        }
      });
      /*
       * Init the list of entities for linechart
       */
      apiService
        .getReportingEntities({
          partners_ids: worldPartner.type.value,
          type_filter: "country,group,city",
        })
        .then(function (result) {
          $scope.reportingCountryEntities = result;
          initParams($route, $scope, [
            {
              name: "reporting",
              isArray: true,
              list: $scope.reportingCountryEntities,
              getItemId: (e) => e.RICid,
            },
          ]);
          initReporting();
        });
      init();
    };

    $scope.changeWorldPartner($scope.worldPartner);

    $scope.changeMultiFlow = function (flow) {
      $scope.multichartFlow = flow;
    };
    $scope.changeMultiLayout = function (layout) {
      $scope.multichartLayout = layout;
    };

    /*
     *  Init the timelines
     */
    function init() {
      /*
       * Init arrays for filters in linechart viz
       */
      $scope.reporting = [];
      $scope.entities.sourceCountryEntity = {};
      $scope.linechartData = [];

      $scope.rawMinDate = d3.min(worldFlows_filtered, function (d) {
        return d.year;
      });
      $scope.rawMaxDate = d3.max(worldFlows_filtered, function (d) {
        return d.year;
      });

      /*
       * Check if dates were in localstorage
       */
      $scope.selectedMinDate = $scope.selectedMinDate || $scope.rawMinDate;
      $scope.selectedMaxDate = $scope.selectedMaxDate || $scope.rawMaxDate;

      if ($scope.selectedMaxDate > 1938) $scope.selectedMaxDate = 1938;

      $scope.timelineData = worldFlowsYearsFormat;
      $scope.tableData = worldFlowsYearsFormat;
      updateDateRange();
    }

    /*
     * Init world multi line chart functions
     */
    function initWorldMultiChart(data) {
      $scope.flowWorld = d3
        .nest()
        .key(function (d) {
          return d.partner;
        })
        .entries(data);
      //extend missing points with null values
      $scope.flowWorld.forEach(function (d) {
        d.values.forEach(function (v) {
          v.year = +v.year;
        });
        for (var i = 1787; i <= 1939; i++) {
          var years = d.values.map(function (e) {
            return e.year;
          });
          if (years.indexOf(i) === -1) {
            d.values.push({
              year: i,
              Imp: null,
              Exp: null,
              total: null,
              source: null,
            });
          }
        }
        //sort by year ascending
        d.values.sort(function (a, b) {
          return a.year - b.year;
        });
      }); //add missing with null
    }

    /*
     * Init line chart functions
     */
    function initTabLineChart(result, yearSelected, type, ric) {
      for (var i = $scope.rawMinDate; i <= $scope.rawMaxDate; i++) {
        yearSelected.push({
          reporting_id: ric,
          type: type,
          partner_id: $scope.worldPartner.type.value,
          year: i,
          imp: null,
          exp: null,
          total: null,
          currency: null,
          sources: null,
        });
      }

      yearSelected.forEach(function (d) {
        result.flows.forEach(function (e) {
          if (d.year === e.year) {
            d.exp = e.exp;
            d.imp = e.imp;
            (d.currency = e.currency), (d.sources = e.sources);
            d.total = e.exp + e.imp;
            if (d.total === 0 || e.exp === null || e.imp === null) d.total = null;
          }
        });
      });
      return yearSelected;
    }

    function initLineChart2(linechart_flows, yearSelected, ric, yValue, color) {
      var linechartData = [];
      var countryTab = {};
      countryTab.values = yearSelected;
      countryTab.color = color;
      countryTab.key = ric;
      countryTab.flowType = yValue;
      linechart_flows.push(countryTab);
      linechart_flows.forEach(function (d) {
        linechartData.push(d);
      });
      return linechartData;
    }

    function initLinechart(partners, yValue, conversion) {
      var linechart_flows = [];
      $scope.yValue = yValue;
      if (partners.length > 0 && conversion === "sterling") {
        partners.forEach(function (d) {
          if (d.type !== "continent") {
            apiService
              .getFlows({
                reporting_ids: d.RICid,
                partner_ids: $scope.worldPartner.type.value,
                with_sources: 1,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);

                var linechartData = initLineChart2(linechart_flows, yearSelected, d.RICid, yValue, d.color);
                if (linechartData.length === partners.length) $scope.linechartData = linechartData;
              });
          } else {
            apiService
              .getContinentFlows({
                continents: d.RICname,
                partner_ids: $scope.worldPartner.type.value,
                with_sources: 1,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);
                var linechartData = initLineChart2(linechart_flows, yearSelected, d.RICid, yValue, d.color);
                if (linechartData.length === partners.length) $scope.linechartData = linechartData;
              });
          }
        });
      }

      var partnersPct = [];
      var linechartData = [];
      if (partners.length > 0 && conversion === "value") {
        partners.forEach(function (d) {
          if (d.type !== "continent") {
            apiService
              .getFlows({
                reporting_ids: d.RICid,
                partner_ids: $scope.worldPartner.type.value,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);

                var tab = pct(worldFlows_filtered, yearSelected, yValue, d.color);
                tab.key = d.RICid;
                linechartData.push(tab);
                if (linechartData.length === partners.length) $scope.linechartData = linechartData;
              });
          } else {
            apiService
              .getContinentFlows({
                continents: d.RICname,
                partner_id: $scope.worldPartner.type.value,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);

                var tab = pct(worldFlows_filtered, yearSelected, yValue, d.color);
                tab.key = d.RICname;
                partnersPct.push(tab);
                linechartData.push(tab);
                if (linechartData.length === partners.length) $scope.linechartData = linechartData;
              });
          }
        });
      }
    }

    function pct(reportingWorldFlows, data, yValue, color) {
      var worldFlowsYears = d3
        .nest()
        .key(function (d) {
          return d.year;
        })
        .entries(reportingWorldFlows);

      var worldFlowsYearsFormat = [];
      worldFlowsYears.forEach(function (d) {
        if (d.key)
          worldFlowsYearsFormat.push({
            reporting_id: null,
            type: null,
            partner_id: $scope.worldPartner.type.value,
            year: d.key,
            imp: d.values[1].flows,
            exp: d.values[0].flows,
            total: d.values[1].flows + d.values[0].flows,
            currency: "sterling",
            sources: d.values[0].sources,
          });
      });

      var pctArray = [];
      data.forEach(function (data) {
        worldFlowsYearsFormat.forEach(function (d) {
          if (data.year == d.year) {
            pctArray.push({
              reporting_id: data.reporting_id,
              type: data.type,
              partner_id: $scope.worldPartner.type.value,
              year: data.year,
              imp: getRatio(data, d, "imp"),
              exp: getRatio(data, d, "exp"),
              total: getRatio(data, d, "total"),
              currency: "percent",
              sources: data.sources,
            });
          }
        });
      });
      var pctArrayInit = {}; // object to save pct arrays
      pctArrayInit.values = pctArray;
      pctArrayInit.color = color;
      pctArrayInit.type = "value";
      pctArrayInit.flowType = yValue;
      return pctArrayInit;
    }

    function getRatio(a, b, yValue) {
      var ratio;
      if (a[yValue] === null || a[yValue] === 0 || b[yValue] === null || b[yValue] === 0) {
        ratio = null;
      } else {
        ratio = (a[yValue] / b[yValue]) * 100;
      }
      return ratio;
    }

    /*
     * Update
     */
    function updateDateRange() {
      $scope.rawYearsRange = d3.range($scope.rawMinDate, $scope.rawMaxDate + 1);
      $scope.rawYearsRange_forInf = d3.range($scope.rawMinDate, $scope.selectedMaxDate);
      $scope.rawYearsRange_forSup = d3.range($scope.selectedMinDate + 1, $scope.rawMaxDate + 1);
      updateTableData();
    }

    /*
     * Update table data
     */
    function updateTableData() {
      $scope.tableData = worldFlowsYearsFormat.filter(function (d) {
        return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      });

      if ($scope.linechartData) {
        var len = $scope.linechartData.length;
        for (var i = 0; i < len; i++) {
          $scope.tableData = $scope.tableData.concat($scope.linechartData[i].values);
        }
      }
    }

    /*
     * Date triggers
     */
    $scope.$watchCollection("[selectedMinDate, selectedMaxDate]", function (newVal, oldVal) {
      if (newVal !== undefined && newVal !== oldVal && newVal[0] != newVal[1]) {
        $scope.selectedMinDate = newVal[0];
        $scope.selectedMaxDate = newVal[1];

        updateTableData();
        updateDateRange();
      }
    });

    $scope.$watch(
      "linechartData",
      function (newValue, oldValue) {
        if (newValue !== oldValue) {
          updateTableData();
        }
      },
      true,
    );

    /*
     * Linechart functions
     */
    function initReporting() {
      $scope.reporting.map((entity) => {
        entity["color"] = $scope.lineColors.pop();
        return entity;
      });
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    }

    $scope.pushReporting = function (elm) {
      if ($scope.reporting.length >= 5) return;
      if (
        $scope.reporting
          .map(function (d) {
            return d.RICid ? d.RICid : d.RICname;
          })
          .indexOf(elm.RICid) > -1
      )
        return;
      elm["color"] = $scope.lineColors.pop();
      $scope.reporting.push(elm);
      $scope.resetDD(elm.type);

      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    };

    $scope.removeReporting = function (elm) {
      if (
        $scope.reporting
          .map(function (d) {
            return d.RICid;
          })
          .indexOf(elm.RICid) < 0
      )
        return;
      var i = $scope.reporting
        .map(function (d) {
          return d.RICid;
        })
        .indexOf(elm.RICid);
      $scope.lineColors.push(elm["color"]);
      $scope.reporting.splice(i, 1);
      if ($scope.reporting.length === 0) {
        $scope.linechartData = [];
      }
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    };

    /*
     * Reset filter and put it to undefined
     */
    $scope.resetDD = function (t) {
      if (t === "country") {
        $scope.entities.sourceCountryEntity.selected = undefined;
      }
    };

    /*
     * Catch user action on filter and push country selected to array reporting
     */
    $scope.change = function (item) {
      $scope.pushReporting(item);
    };

    $scope.changeCurrency = function (currency) {
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, currency.type.value);
      $scope.linechartCurrency = currency;
    };

    $scope.changeFlow = function (flow) {
      initLinechart($scope.reporting, flow.type.value, $scope.linechartCurrency.type.value);
      $scope.linechartFlow = flow;
    };

    /*
     * Display and sort table data + download csv
     */
    $scope.gridOptions = {
      data: "tableData",
      paginationPageSizes: [50],
      paginationPageSize: 50,
      columnDefs: WORLD_TABLE_HEADERS,
      columnFooterHeight: 45,
      enableHorizontalScrollbar: 2,
      enableVerticalScrollbar: 1,
    };

    /*
     * Download all data World + countries selected
     */
    $scope.download = function () {
      var fileName = "RICardo - World - " + $scope.selectedMinDate + " - " + $scope.selectedMaxDate;
      var headers = WORLD_TABLE_HEADERS.map(function (h) {
        return h.displayName;
      });

      var order = WORLD_TABLE_HEADERS.map(function (h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order, fileName);
    };
  },
]);
