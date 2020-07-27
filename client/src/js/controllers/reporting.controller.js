import { initParams, getListItemId } from "../utils";

/*
 * Reporting view Controller : api call and data manipulation to serve four
 * visualisations (dualtimeline, brushing, partner histogram & linechart)
 */
angular.module("ricardo.controllers.reporting", []).controller("reporting", [
  "$scope",
  "$route",
  "$routeParams",
  "$location",
  "cfSource",
  "apiService",
  "utils",
  "reportingService",
  "reportingEntities",
  "TABLE_HEADERS",
  "LINE_CHART_CURRENCY",
  "LINE_CHART_FLOW_TYPES",
  function (
    $scope,
    $route,
    $routeParams,
    $location,
    cfSource,
    apiService,
    utils,
    reportingService,
    reportingEntities,
    TABLE_HEADERS,
    LINE_CHART_CURRENCY,
    LINE_CHART_FLOW_TYPES,
  ) {
    /*
     * Message error if no data
     */
    $scope.missing = false;
    $scope.missingPartner = false;
    $scope.missingBilateral = false;
    $scope.ok = function () {
      $scope.missing = false;
    };

    $scope.okPartner = function () {
      $scope.missingPartner = false;
    };

    $scope.okBilateral = function () {
      $scope.missingBilateral = false;
    };

    /*
     * Partners Histo filter
     */
    $scope.filters = [
      {
        type: { value: "all", writable: true },
        name: { value: "All", writable: true },
      },
      {
        type: { value: "city/part_of", writable: true },
        name: { value: "City", writable: true },
      },
      {
        type: { value: "colonial_area", writable: true },
        name: { value: "Colonial", writable: true },
      },
      {
        type: { value: "country", writable: true },
        name: { value: "Country", writable: true },
      },
      {
        type: { value: "geographical_area", writable: true },
        name: { value: "Geo", writable: true },
      },
      {
        type: { value: "group", writable: true },
        name: { value: "Group", writable: true },
      },
    ];
    $scope.filtered = $scope.filters[0];

    $scope.ordered = {
      type: { value: "tot", writable: true },
      name: { value: "Average share on Total", writable: true },
    };
    $scope.orders = [
      {
        type: { value: "tot", writable: true },
        name: { value: "Average share on Total", writable: true },
      },
      {
        type: { value: "imp", writable: true },
        name: { value: "Average share on Imports", writable: true },
      },
      {
        type: { value: "exp", writable: true },
        name: { value: "Average share on Exports", writable: true },
      },
      {
        type: { value: "name", writable: true },
        name: { value: "Name", writable: true },
      },
    ];

    $scope.groups = [
      {
        type: { value: 0, writable: true },
        name: { value: "None", writable: true },
      },
      {
        type: { value: 1, writable: true },
        name: { value: "Continent", writable: true },
      },
    ];
    $scope.grouped = $scope.groups[0];

    $scope.linechartCurrencyChoices = LINE_CHART_CURRENCY;
    $scope.linechartCurrency = LINE_CHART_CURRENCY[0];

    $scope.linechartFlowChoices = LINE_CHART_FLOW_TYPES;
    $scope.linechartFlow = LINE_CHART_FLOW_TYPES[0];

    /*
     * All var declarations
     */
    var data;
    $scope.reportingEntities = reportingEntities;
    $scope.messagePercent = 0;
    $scope.entities = {
      sourceEntity: {},
      sourceCountryEntity: {},
      sourceColonialEntity: {},
      sourceGeoEntity: {},
      sourceContinentEntity: {},
      sourceWorldEntity: {},
    };

    /*
     * Arrays of entities for linechart
     */
    $scope.comparison = [];
    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];

    /*
     * Linecharts default config
     */
    $scope.lineColors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c"];
    $scope.view = "country";
    $scope.missingData = [];
    /*
     * Trigger to show or hide data table
     */
    $scope.viewTable = 0;

    $scope.yValue = "total";
    $scope.conversion = "sterling";
    $scope.filter = "all";
    $scope.order = "tot";
    $scope.currency = 0;
    $scope.actualCurrency = "pound sterling";

    /*
     * Political statuses data
     */
    $scope.statusesData = {};

    /*
     * First init with local storage
     */
    $scope.entities.sourceEntity.selected = $scope.reportingEntities
      .filter(function (e) {
        return e.RICid === $routeParams.reporting;
      })
      .shift();

    // If the reporting slug doesn't exist, we remove it from the localstorage and redirect to `/reporting`
    if (!$scope.entities.sourceEntity.selected) {
      localStorage.removeItem("sourceEntitySelected");
      return $location.url("/reporting");
    }

    // Init the data
    initParams($route, $scope, [
      {
        name: "selectedMinDate",
      },
      {
        name: "selectedMaxDate",
      },
      {
        name: "filtered",
        list: $scope.filters,
        getItemId: getListItemId,
      },
      {
        name: "ordered",
        list: $scope.orders,
        getItemId: getListItemId,
      },
      {
        name: "grouped",
        list: $scope.groups,
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
    init($scope.entities.sourceEntity.selected.RICid, $scope.currency);

    function initTabLineChart(result, yearSelected, type, ric) {
      for (var i = $scope.rawMinDate; i <= $scope.rawMaxDate; i++) {
        yearSelected.push({
          reporting_id: $scope.entities.sourceEntity.selected.RICid,
          type: type,
          partner_id: ric,
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

    /*
     * Calling the API to init country selection
     */
    function init(sourceID, currency) {
      Promise.all([
        apiService.getFlows({
          reporting_ids: sourceID,
          with_sources: 1,
        }),
        apiService.getGeoPolHistData(),
      ]).then(function ([data, gphData]) {
        var dates = data.flows.map(function (d) {
          return d.year;
        });

        $scope.selectedMinDate = $scope.selectedMinDate || d3.min(dates);
        $scope.selectedMaxDate = $scope.selectedMaxDate || d3.max(dates);

        data.flows = data.flows.filter(function (d) {
          if (d.imp || d.exp !== 0) return d;
        });
        $scope.tableData = data.flows;

        $scope.statusesData = gphData;

        if (cfSource.size() > 0) {
          cfSource.year().filterAll();
          cfSource.clear();
        }

        $scope.actualCurrency = data.flows[0].currency;
        $scope.RICentities = {};

        data.RICentities.partners.forEach(function (d) {
          $scope.RICentities["" + d.RICid] = {
            RICname: d.RICname,
            type: d.type,
            RICid: d.RICid,
            continent: d.continent,
          };
        });
        $scope.RICentitiesDD = [];
        data.RICentities.partners.forEach(function (d) {
          $scope.RICentitiesDD.push(d);
          if ($scope.RICentitiesDD[$scope.RICentitiesDD.length - 1].RICname.indexOf("World ") !== 0)
            $scope.RICentitiesDD[$scope.RICentitiesDD.length - 1].RICname = d.RICname + "[" + d.type + "]";
        });

        /*
         *  Init all entities by types filters for linechart viz
         */
        $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function (d) {
          return d.type === "country";
        });
        $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function (d) {
          return d.type === "colonial_area";
        });
        $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function (d) {
          return d.type === "geographical_area" && d.RICname.indexOf("World ") !== 0;
        });
        $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function (d) {
          return d.type === "geographical_area" && d.RICname.indexOf("World ") === 0;
        });

        $scope.reportingCountryEntities1 = $scope.RICentitiesDD.filter(function (d) {
          return d.RICname.indexOf("World ") !== 0;
        });

        /*
         * Special methods for continent
         */
        var continents = d3
          .nest()
          .key(function (d) {
            return d.continent;
          })
          .entries(
            $scope.RICentitiesDD.filter(function (d) {
              return d.continent;
            }),
          )
          .map(function (d) {
            return d.key;
          });

        $scope.reportingContinentEntities = [];

        continents.forEach(function (d) {
          var elm = { RICname: d, type: "continent", RICid: d };
          $scope.reportingContinentEntities.push(elm);
        });

        initParams($route, $scope, [
          {
            name: "comparison",
            isArray: true,
            list: $scope.RICentitiesDD.concat($scope.reportingContinentEntities),
            getItemId: (e) => e.RICid,
          },
        ]);
        initReporting();
        /*
         * Line chart world
         */
        $scope.comparison = $scope.comparison || [];
        $scope.entities.sourceCountryEntity = {};
        $scope.entities.sourceColonialEntity = {};
        $scope.entities.sourceGeoEntity = {};
        $scope.entities.sourceContinentEntity = {};
        $scope.entities.sourceWorldEntity = {};

        $scope.rawMinDate = d3.min(data.flows, function (d) {
          return d.year;
        });
        $scope.rawMaxDate = d3.max(data.flows, function (d) {
          return d.year;
        });

        $scope.rawYearsRange = d3.range($scope.rawMinDate, $scope.rawMaxDate + 1);
        $scope.rawYearsRange_forInf = d3.range($scope.rawMinDate, $scope.selectedMaxDate);
        $scope.rawYearsRange_forSup = d3.range($scope.selectedMinDate + 1, $scope.rawMaxDate + 1);
        /*
         * Build data for timeline
         */
        data.flows.forEach(function (d) {
          d.type = $scope.RICentities["" + d.partner_id].type;
          d.continent = $scope.RICentities[d.partner_id + ""].continent;
        });
        var onlyWorld = data.flows.every(function (d) {
          return d.continent === "World";
        });
        if (onlyWorld) $scope.missingBilateral = true;

        cfSource.add(data.flows);

        // delete world flows, maybe api action ?
        cfSource.partner().filter(function (p) {
          return !/^World/.test(p);
        });
        var flowsPerYear = cfSource.years().top(Infinity);
        // arrrrrg CFSource kill me ! we need to do a hard copy.
        flowsPerYear = JSON.parse(JSON.stringify(flowsPerYear));
        cfSource.partner().filterAll();

        var timelineData = [];

        flowsPerYear.sort(function (a, b) {
          return d3.ascending(a.key, b.key);
        });
        flowsPerYear.forEach(function (d) {
          var td = $.extend(d.value, {
            year: new Date(d.key).getFullYear(),
          });
          if (!td.exp) td.exp = null;
          if (!td.imp) td.imp = null;
          if (!td.tot) td.tot = null;
          timelineData.push(td);
        });

        $scope.timelineData = timelineData;

        initPartnerHisto($scope.tableData);

        /*
         * Save all object in localStorage
         */
        localStorage.removeItem("sourceEntitySelected");
        localStorage.setItem("sourceEntitySelected", JSON.stringify($scope.entities.sourceEntity.selected));
      });
    }

    /*
     * Triggers entity selected and dates
     */
    $scope.$watchCollection("[selectedMinDate, selectedMaxDate]", function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] != newValue[1]) {
        // update local storage
        updateDateRange();
        initPartnerHisto($scope.tableData);
      }
    });

    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue) {
      if (newValue !== oldValue && newValue) {
        // update local storage
        localStorage.setItem("sourceEntitySelected", newValue);
        return $location.url(`/reporting/${newValue.RICid}`);
      }
    });

    /*
     * Update data table
     */
    function updateDateRange() {
      $scope.rawYearsRange = d3.range($scope.rawMinDate, $scope.rawMaxDate + 1);
      $scope.rawYearsRange_forInf = d3.range($scope.rawMinDate, $scope.selectedMaxDate);
      $scope.rawYearsRange_forSup = d3.range($scope.selectedMinDate + 1, $scope.rawMaxDate + 1);

      updateTableData();
    }

    function updateTableData() {
      if (!$scope.tableData) return;

      //filter tableData by date
      var tableData = $scope.tableData.filter(function (d) {
        return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      });

      var partner_selected = $scope.comparison.map(function (d) {
        return d.RICid;
      });
      var tableDataSources = tableData;
      if (partner_selected.length > 0) {
        tableDataSources = [];
        $scope.comparison.forEach(function (r) {
          if (r.type !== "continent")
            var dataFiltered = tableData.filter(function (d) {
              return d.partner_id === r.RICid;
            });
          else
            var dataFiltered = tableData.filter(function (d) {
              return $scope.RICentities["" + d.partner_id].continent === r.RICid;
            });
          tableDataSources = tableDataSources.concat(dataFiltered);
        });
      }
      $scope.tableDataSources = tableDataSources;

      var missing;
      var allExpNull = $scope.tableDataSources.every(function (d) {
        return d.exp === null;
      });

      var allImpNull = $scope.tableDataSources.every(function (d) {
        return d.imp === null;
      });

      if (allExpNull && allImpNull) {
        missing = true;
      } else {
        missing = false;
      }

      $scope.missing = missing;
    }

    /*
     * Push item in array to display line chart
     */
    function initReporting() {
      $scope.comparison.map((entity) => {
        entity["color"] = $scope.lineColors.pop();
        return entity;
      });
      initLinechart($scope.comparison, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    }

    $scope.pushComparison = function (elm) {
      if ($scope.comparison.length >= 5) return;
      if (
        $scope.comparison
          .map(function (d) {
            return d.RICid;
          })
          .indexOf(elm.RICid) > -1
      )
        return;
      elm["color"] = $scope.lineColors.pop();
      $scope.comparison.push(elm);
      $scope.resetDD(elm.type);
      initLinechart($scope.comparison, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    };

    /*
     * Remove item of the array of reporting to display line chart world
     */
    $scope.removeComparison = function (elm) {
      if (
        $scope.comparison
          .map(function (d) {
            return d.RICid;
          })
          .indexOf(elm.RICid) < 0
      )
        return;
      var i = $scope.comparison
        .map(function (d) {
          return d.RICid;
        })
        .indexOf(elm.RICid);
      $scope.lineColors.push(elm["color"]);
      $scope.comparison.splice(i, 1);
      d3.select("#linechart-world-container > svg").remove();
      initLinechart($scope.comparison, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      updateTableData();
    };

    /*
     * Reset view filters to undefined
     */

    $scope.resetDD = function (t) {
      $scope.entities.sourceCountryEntity.selected = undefined;
      $scope.entities.sourceWorldEntity.selected = undefined;
      $scope.entities.sourceContinentEntity.selected = undefined;
    };

    function buildIndexYears(data) {
      var indexYears = {};

      d3.nest()
        .key(function (d) {
          return d.year;
        })
        .rollup(reportingService.rollupYears)
        .entries(data)
        .forEach(function (y) {
          indexYears[y.key] = y.values;
        });
      return indexYears;
    }

    /*
     * Partners histo triggers functions and init function partner Histo
     */
    function initPartnerHisto(data) {
      if (!$scope.tableData) return;
      var data = [];
      var temp = $scope.tableData;
      // Select data between date selected
      temp.forEach(function (d) {
        if (d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate) {
          data.push(d);
        }
      });
      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;

      // filter data without world reference
      data = data.filter(function (p) {
        return !/^World/.test(p.partner_id);
      });

      /*
       * Here we lost type information of entity. Need to use addTypePartner().
       */
      var partners = d3
        .nest()
        .key(function (d) {
          return d[$scope.grouped.type.value ? "continent" : "partner_name"];
        })
        .key(function (d) {
          return d.year;
        })
        .rollup(reportingService.rollupYears)
        .entries(data);

      partners = reportingService.addTypePartner(partners, data);
      partners = reportingService.valuesToPartners(partners, indexYears);

      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) {
          return d.type === $scope.filtered.type.value;
        });
      $scope.partnersData = partners;
    }

    $scope.changeGroup = function (group) {
      $scope.grouped = group;

      var data = $scope.tableData;
      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;

      data = data.filter(function (p) {
        return !/^World/.test(p.partner_id);
      });

      var partners = d3
        .nest()
        .key(function (d) {
          return d[group.type.value ? "continent" : "partner_name"];
        })
        .key(function (d) {
          return d.year;
        })
        .rollup(reportingService.rollupYears)
        .entries(data);

      partners = reportingService.addTypePartner(partners, data);
      partners = reportingService.valuesToPartners(partners, indexYears);

      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) {
          return d.type === $scope.filtered.type.value;
        });

      $scope.partnersData = partners;

      if (partners.length === 0) $scope.missingPartner = true;
    };

    $scope.changeOrder = function (order) {
      $scope.ordered = order;
    };

    $scope.changeFilter = function (filter) {
      $scope.filtered = filter;

      var data = $scope.tableData;
      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;

      data = data.filter(function (p) {
        return !/^World/.test(p.partner_id);
      });

      var partners = d3
        .nest()
        .key(function (d) {
          return d[$scope.grouped.type.value ? "continent" : "partner_name"];
        })
        .key(function (d) {
          return d.year;
        })
        .rollup(reportingService.rollupYears)
        .entries(data);

      partners = reportingService.addTypePartner(partners, data);
      partners = reportingService.valuesToPartners(partners, indexYears);

      if (filter.type.value !== "all")
        partners = partners.filter(function (d) {
          return d.type === filter.type.value;
        });

      $scope.partnersData = partners;
      if (partners.length === 0) $scope.missingPartner = true;
    };

    /*
     *  Linechart triggers
     */
    $scope.change = function (item) {
      $scope.pushComparison(item);
    };
    $scope.changeCountry = function (country) {
      $scope.pushComparison(country);
    };

    $scope.changeColonial = function (colonial) {
      $scope.pushComparison(colonial);
    };

    $scope.changeGeo = function (geo) {
      $scope.pushComparison(geo);
    };

    $scope.changeContinent = function (continent) {
      $scope.pushComparison(continent);
    };

    $scope.changeWorld = function (world) {
      $scope.pushComparison(world);
    };

    $scope.changeCurrency = function (currency) {
      initLinechart($scope.comparison, $scope.linechartFlow.type.value, currency.type.value);
      $scope.linechartCurrency = currency;
      $scope.messagePercent = currency.type.value === "value";
    };

    $scope.changeFlow = function (flow) {
      initLinechart($scope.comparison, flow.type.value, $scope.linechartCurrency.type.value);
      $scope.linechartFlow = flow;
    };

    /*
     * linechart functions
     */
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
                reporting_ids: $scope.entities.sourceEntity.selected.RICid,
                partner_ids: d.RICid,
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
                continents: d.RICid,
                reporting_ids: $scope.entities.sourceEntity.selected.RICid,
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

      var linechartData = [];
      if (partners.length > 0 && conversion === "value") {
        partners.forEach(function (d) {
          if (d.type !== "continent") {
            apiService
              .getFlows({
                reporting_ids: $scope.entities.sourceEntity.selected.RICid,
                partner_ids: d.RICid,
                with_sources: 1,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);
                changeInPercent($scope.entities.sourceEntity.selected.RICid, yValue, yearSelected, d.color, function (
                  tab,
                ) {
                  tab.key = d.RICid;
                  linechartData.push(tab);

                  if (linechartData.length === partners.length) $scope.linechartData = linechartData;
                });
              });
          } else {
            apiService
              .getContinentFlows({
                continents: d.RICid,
                reporting_ids: $scope.entities.sourceEntity.selected.RICid,
              })
              .then(function (result) {
                var yearSelected = [];
                yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid);

                changeInPercent($scope.entities.sourceEntity.selected.RICid, yValue, yearSelected, d.color, function (
                  tab,
                ) {
                  tab.key = d.RICid;
                  linechartData.push(tab);
                  if (linechartData.length === partners.length) $scope.linechartData = linechartData;
                });
              });
          }
        });
      }
    }

    function changeInPercent(reporting_id, yValue, data, color, callback) {
      var percentArrayInit = {}; // object to save pct arrays
      apiService
        .getFlows({
          reporting_ids: reporting_id,
          partner_ids: "Worldsumpartners",
        })
        .then(function (result) {
          // we could don't need this array if api data have good format
          var worldFlowsYears = result.flows;

          // need a new algo to delete two forEach
          var pctArray = [];
          data.forEach(function (data) {
            worldFlowsYears.forEach(function (d) {
              if (data.year == d.year) {
                // == because it's str vs integer
                pctArray.push({
                  reporting_id: data.reporting_id,
                  type: data.type,
                  partner_id: data.partner_id,
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
          percentArrayInit.values = pctArray;
          percentArrayInit.color = color;
          percentArrayInit.type = "value";
          percentArrayInit.flowType = yValue;

          callback(percentArrayInit);
        });
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
     * Display and sort table data
     */
    $scope.loading = false;

    $scope.gridOptions = {
      data: "tableDataSources",
      paginationPageSizes: [50],
      paginationPageSize: 50,
      columnDefs: TABLE_HEADERS,
      columnFooterHeight: 45,
      enableHorizontalScrollbar: 2,
      enableVerticalScrollbar: 1,
    };

    /*
     * Download functions to have data in csv
     */
    $scope.download = function () {
      apiService
        .getFlows({
          reporting_ids: $scope.entities.sourceEntity.selected.RICid,
          with_sources: 1,
        })
        .then(function (result) {
          var headers = TABLE_HEADERS.map(function (h) {
            return h.displayName;
          });

          var order = TABLE_HEADERS.map(function (h) {
            return h.field;
          });

          var fileName =
            "RICardo - Reporting - " +
            $scope.entities.sourceEntity.selected.RICid +
            " - " +
            $scope.selectedMinDate +
            " - " +
            $scope.selectedMaxDate;

          utils.downloadCSV(result.flows, headers, order, fileName);
        });
    };

    /*
     * Download functions to have data in csv with original currency
     */
    $scope.downloadCurrency = function () {
      apiService
        .getFlows({
          reporting_ids: $scope.entities.sourceEntity.selected.RICid,
          with_sources: 1,
          original_currency: 1,
        })
        .then(function (result) {
          var headers = TABLE_HEADERS.map(function (h) {
            return h.displayName;
          });

          var order = TABLE_HEADERS.map(function (h) {
            return h.field;
          });

          var fileName =
            "RICardo - Reporting - " +
            $scope.entities.sourceEntity.selected.RICid +
            " - " +
            $scope.selectedMinDate +
            " - " +
            $scope.selectedMaxDate +
            " - Original currency";

          utils.downloadCSV(result.flows, headers, order, fileName);
        });
    };
  },
]);
