import { initParams, getListItemId } from "../utils";

/*
 * Bilateral view controller : api call and data manipulation to serve three
 * visualisations (dualtimeline, brushing & comparison timeline). ******
 */
angular.module("ricardo.controllers.bilateral", []).controller("bilateral", [
  "$scope",
  "$route",
  "$routeParams",
  "$location",
  "reportingEntities",
  "cfSource",
  "cfTarget",
  "apiService",
  "dataTableService",
  "utils",
  "DEFAULT_REPORTING",
  "DEFAULT_PARTNER",
  "TABLE_HEADERS",
  function (
    $scope,
    $route,
    $routeParams,
    $location,
    reportingEntities,
    cfSource,
    cfTarget,
    apiService,
    dataTableService,
    utils,
    DEFAULT_REPORTING,
    DEFAULT_PARTNER,
    TABLE_HEADERS,
  ) {
    /*
     * Display message if error in selection
     */
    $scope.ok = function () {
      $scope.missing = false;
    };
    $scope.okTarget = function () {
      $scope.missingTarget = false;
    };
    $scope.okBilateral = function () {
      $scope.missingBilateral = false;
      $scope.missingTarget = false; //test on Benin(Dahomey)
    };
    $scope.fieldsByDefault = function () {
      $scope.missingTarget = false;
      window.location.reload();
    };
    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };

    /*
     * Var initialisation
     */
    var data;
    var RICids = reportingEntities.map(function (d) {
      return d.RICid;
    });
    $scope.reportingEntities = reportingEntities;
    $scope.actualCurrency = "pound sterling";
    $scope.tableData = [];
    $scope.totalServerItems = 0;
    $scope.alerts = [];

    // States
    $scope.timelineData;
    $scope.entities = { sourceEntity: {}, targetEntity: {} };
    $scope.rawMinDate;
    $scope.rawMaxDate;
    $scope.rawYearsRange;
    $scope.rawYearsRange_forInf;
    $scope.rawYearsRange_forSup;

    /*
     * First init - reporting/partners validation
     */
    // Retieve the source country
    // ------------------------------------------------------------
    $scope.entities.sourceEntity.selected = $scope.reportingEntities
      .filter(function (e) {
        return e.RICid === $routeParams.entitySource;
      })
      .shift();
    // Check its existance
    if (!$scope.entities.sourceEntity.selected) {
      return $location.url("/bilateral");
    }

    // Retrieve the target country (if present)
    // ------------------------------------------------------------
    if ($routeParams.entityTarget) {
      // Retieve the source country
      $scope.entities.targetEntity.selected = $scope.reportingEntities
        .filter(function (e) {
          return e.RICid === $routeParams.entityTarget;
        })
        .shift();
      // Check its existance
      if (!$scope.entities.targetEntity.selected) {
        return $location.url(`/bilateral/${$routeParams.entitySource}`);
      }
    }

    // Calling tha API to get the partner for the source entity
    apiService
      .getFlows({
        reporting_ids: $scope.entities.sourceEntity.selected.RICid,
      })
      .then(function (result) {
        $scope.partnerEntities = result.RICentities.partners.filter(function (d) {
          return (
            RICids.indexOf(d.RICid) !== -1 &&
            d.type === "country" &&
            d.RICid !== $scope.entities.sourceEntity.selected.RICid
          );
        });
        if ($scope.partnerEntities.length === 0) $scope.missingBilateral = true;
        else {
          // If there is no target, we redirect to the first partner
          if (!$routeParams.entityTarget) {
            return $location.url(`/bilateral/${$routeParams.entitySource}/${$scope.partnerEntities[0].RICid}`);
          } else {
            $scope.entities.targetEntity.selected = $scope.partnerEntities
              .filter((e) => e.RICid === $routeParams.entityTarget)
              .shift();
            if (!$scope.entities.targetEntity.selected) return $location.url(`/bilateral/${$routeParams.entitySource}`);
            init($scope.entities.sourceEntity.selected.RICid, $scope.entities.targetEntity.selected.RICid);
          }
        }
      });

    function init(sourceID, targetID, minDate, maxDate) {
      if (targetID !== undefined) {
        apiService
          .getFlows({
            reporting_ids: sourceID,
            partner_ids: targetID,
            with_sources: 1,
          })
          .then(
            function (data) {
              /*
               * Set min & max dates
               */
              $scope.rawMinDate = d3.min(data.flows, function (d) {
                return d.year;
              });
              $scope.rawMaxDate = d3.max(data.flows, function (d) {
                return d.year;
              });

              if (minDate && maxDate) {
                $scope.selectedMinDate = minDate;
                $scope.selectedMaxDate = maxDate;
              } else {
                $scope.selectedMinDate = $scope.rawMinDate;
                $scope.selectedMaxDate = $scope.rawMaxDate;
              }

              initParams($route, $scope, [
                {
                  name: "selectedMinDate",
                },
                {
                  name: "selectedMaxDate",
                },
              ]);

              /*
               * Consolidate data, add mirror's data to flows array
               */
              mergeMirrorInFlows(data);

              /*
               * save data to scope
               */
              $scope.allData = data;
              /*
               * Send data to timeline directive
               */
              $scope.timelineData = data.flows;
              /*
               * Save source & target in localStorage
               */
              localStorage.setItem("selectedMinDate", JSON.stringify($scope.selectedMinDate));
              localStorage.setItem("selectedMaxDate", JSON.stringify($scope.selectedMaxDate));

              // call function to send data to tableData
              updateDateRange();
            },
            function (res) {
              if (res[1] === 500) {
                $scope.missingTarget = true;
                if ($scope.entities.sourceEntity.selected.RICid == $scope.entities.targetEntity.selected.RICid) {
                  $scope.message = "Same source and target " + $scope.entities.targetEntity.selected.RICname;
                } else {
                  $scope.message = "Missing Target " + $scope.entities.targetEntity.selected.RICname;
                }
              }
            },
          );
      }
    }

    /*
     * Watch if entities and dates change
     */
    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue) {
      if (newValue && newValue.RICid !== oldValue.RICid) {
        // set data in local storage
        localStorage.setItem("sourceEntitySelected", JSON.stringify(newValue));
        let urlParams = Object.assign({}, $route.current.params);
        urlParams["entitySource"] = newValue.RICid;
        $route.updateParams(urlParams);
      }
    });

    $scope.$watch("entities.targetEntity.selected", function (newValue, oldValue) {
      if (newValue && newValue.RICid !== oldValue.RICid) {
        let urlParams = Object.assign({}, $route.current.params);
        urlParams["entityTarget"] = newValue.RICid;
        $route.updateParams(urlParams);
      }
    });

    $scope.$watchCollection("[selectedMinDate, selectedMaxDate]", function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] !== newValue[1]) {
        updateDateRange();
      }
    });

    /*
     * Update Range from date on flows array
     */
    function updateDateRange() {
      $scope.rawYearsRange = d3.range($scope.rawMinDate, $scope.rawMaxDate + 1);
      $scope.rawYearsRange_forInf = d3.range($scope.rawMinDate, $scope.selectedMaxDate);
      $scope.rawYearsRange_forSup = d3.range($scope.selectedMinDate + 1, $scope.rawMaxDate + 1);
      if ($scope.allData !== undefined) {
        cfSource.clear();
        cfSource.add(
          $scope.allData.flows.filter(function (d) {
            return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
          }),
        );

        cfTarget.clear();
        cfTarget.add(
          $scope.allData.mirror_flows.filter(function (d) {
            return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
          }),
        );

        $scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity));

        // Select data to check if there are and if not, display message no data
        var dataFilterBySource = d3
          .nest()
          .key(function (d) {
            return d.reporting_id;
          })
          .entries($scope.tableData);

        if (dataFilterBySource[0] !== undefined) {
          var missing;
          var allExpNull = dataFilterBySource[0].values.every(function (d) {
            return d.exp === null;
          });
          var allImpNull = dataFilterBySource[0].values.every(function (d) {
            return d.imp === null;
          });

          if (allExpNull && allImpNull) {
            missing = true;
          } else {
            missing = false;
          }
          $scope.missing = missing;
        }
      }
    }

    /*
     * Merge mirror array in flows array
     */
    function mergeMirrorInFlows(data) {
      // exchange between countries by year
      var mirrorFlows_byYear = {};

      /*
       * First step : clean mirror_flows and push data into mirrorFlos_byYear
       */
      data.mirror_flows.forEach(function (d) {
        var obj = mirrorFlows_byYear[d.year] || {};
        obj.imp = d.imp || null;
        obj.exp = d.exp || null;
        mirrorFlows_byYear[d.year] = obj; // useless ?
      });

      /*
       * Second step : add mirror_flow to flow
       */
      data.flows.forEach(function (d) {
        var mirror = mirrorFlows_byYear[d.year];
        if (mirror) {
          d.imp_mirror = mirror.imp || null;
          d.exp_mirror = mirror.exp || null;
        } else {
          d.imp_mirror = null;
          d.exp_mirror = null;
        }
      });
    }

    /*
     * Datatable initalisation & functions
     */
    $scope.gridOptions = {
      data: "tableData",
      paginationPageSizes: [50],
      paginationPageSize: 50,
      columnDefs: TABLE_HEADERS,
      columnFooterHeight: 45,
      enableHorizontalScrollbar: 2,
      enableVerticalScrollbar: 1,
    };

    /*
     * Download data selected
     */
    $scope.download = function () {
      var fileName =
        "RICardo - Bilateral - " +
        $scope.entities.sourceEntity.selected.RICid +
        " - " +
        $scope.entities.targetEntity.selected.RICid +
        " - " +
        $scope.selectedMinDate +
        " - " +
        $scope.selectedMaxDate;
      var headers = TABLE_HEADERS.map(function (h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function (h) {
        return h.field;
      });

      var data = $scope.tableData;
      utils.downloadCSV(data, headers, order, fileName);
    };
  },
]);
