import { initParams, getListItemId } from "../utils";
angular.module("ricardo.controllers.metadata", []).controller("metadata", [
  "$scope",
  "$route",
  "$routeParams",
  "$location",
  "apiService",
  "utils",
  "METADATA_TABLE_HEADERS",
  function ($scope, $route, $routeParams, $location, apiService, utils, METADATA_TABLE_HEADERS) {
    $scope.flowChoices = [
      {
        type: { value: "total", writable: true },
        name: { value: "Total", writable: true },
      },
      {
        type: { value: "Exp", writable: true },
        name: { value: "Export", writable: true },
      },
      {
        type: { value: "Imp", writable: true },
        name: { value: "Import", writable: true },
      },
    ];
    $scope.chartFlow = $scope.flowChoices[0];
    $scope.partnerChoices = [
      {
        type: { value: "bilateral", writable: true },
        name: { value: "Bilateral Flows", writable: true },
      },
      {
        type: { value: "world", writable: true },
        name: { value: "World Flows", writable: true },
      },
    ];

    $scope.partner = $scope.partnerChoices
      .filter((e) => {
        return e.type.value === $routeParams.flowtype;
      })
      .shift();
    if (!$scope.partner) {
      return $location.url("/metadata");
    }
    $scope.bilateral = $scope.partner.type.value === "bilateral";
    $scope.multichartLayoutChoices = [
      {
        type: { value: "multiple", writable: true },
        name: { value: "Multiple View", writable: true },
      },
      {
        type: { value: "zero", writable: true },
        name: { value: "Stacked View", writable: true },
      },
      {
        type: { value: "expand", writable: true },
        name: { value: "Percentage View", writable: true },
      },
    ];
    $scope.multichartLayout = $scope.multichartLayoutChoices[0];

    initParams($route, $scope, [
      {
        name: "chartFlow",
        list: $scope.flowChoices,
        getItemId: getListItemId,
      },
      {
        name: "matrixLayout",
        list: [
          {
            type: { value: "years", writable: true },
            name: { value: "Number of Reporting Years", writable: true },
          },
          {
            type: { value: "partnerAvg", writable: true },
            name: { value: "Partners in Average", writable: true },
          },
          {
            type: { value: "alphabet", writable: true },
            name: { value: "Reporting Name", writable: true },
          },
        ],
        getItemId: getListItemId,
      },
      {
        name: "matrixColorBy",
        list: [
          {
            type: { value: "sourcetype", writable: true },
            name: { value: "Source Type", writable: true },
          },
          {
            type: { value: "type", writable: true },
            name: { value: "Reporting Type", writable: true },
          },
          {
            type: { value: "continent", writable: true },
            name: { value: "Reporting Continent", writable: true },
          },
          {
            type: { value: "partner", writable: true },
            name: { value: "Number of Partners", writable: true },
          },
          {
            type: { value: "partner_intersect", writable: true },
            name: { value: "Number of Mirror Partners", writable: true },
          },
          ,
          {
            type: { value: "reference", writable: true },
            name: { value: "World Partner", writable: true },
          },
        ],
        getItemId: getListItemId,
      },
    ]);

    function updateLayoutChoices(partner) {
      if (partner === "bilateral")
        $scope.matrixLayoutChoices = [
          {
            type: { value: "years", writable: true },
            name: { value: "Number of Reporting Years", writable: true },
          },
          {
            type: { value: "partnerAvg", writable: true },
            name: { value: "Partners in Average", writable: true },
          },
          {
            type: { value: "alphabet", writable: true },
            name: { value: "Reporting Name", writable: true },
          },
        ];
      if (partner === "world")
        $scope.matrixLayoutChoices = [
          {
            type: { value: "years", writable: true },
            name: { value: "Number of Reporting Years", writable: true },
          },
          {
            type: { value: "alphabet", writable: true },
            name: { value: "Reporting Name", writable: true },
          },
        ];
    }
    updateLayoutChoices($scope.partner.type.value);
    $scope.matrixLayout = $scope.matrixLayout || $scope.matrixLayoutChoices[0];

    function updateColorChoices(partner) {
      if (partner === "bilateral")
        $scope.matrixColorChoices = [
          {
            type: { value: "sourcetype", writable: true },
            name: { value: "Source Type", writable: true },
          },
          {
            type: { value: "type", writable: true },
            name: { value: "Reporting Type", writable: true },
          },
          {
            type: { value: "continent", writable: true },
            name: { value: "Reporting Continent", writable: true },
          },
          {
            type: { value: "partner", writable: true },
            name: { value: "Number of Partners", writable: true },
          },
          {
            type: { value: "partner_intersect", writable: true },
            name: { value: "Number of Mirror Partners", writable: true },
          },
        ];
      if (partner === "world")
        $scope.matrixColorChoices = [
          {
            type: { value: "sourcetype", writable: true },
            name: { value: "Source Type", writable: true },
          },
          {
            type: { value: "type", writable: true },
            name: { value: "Reporting Type", writable: true },
          },
          {
            type: { value: "continent", writable: true },
            name: { value: "Reporting Continent", writable: true },
          },
          {
            type: { value: "reference", writable: true },
            name: { value: "World Partner", writable: true },
          },
        ];
    }
    updateColorChoices($scope.partner.type.value);
    $scope.matrixColorBy = $scope.matrixColorBy || $scope.matrixColorChoices[0];

    $scope.changeFlow = function (flow) {
      $scope.chartFlow = flow;
      $scope.nbFlows = $scope.numberFlows.filter(function (d) {
        return d.expimp === flow.type.value;
      });
      reprocess($scope.data, $scope.partner.type.value);
    };

    $scope.changePartner = function (partner) {
      return $location.url(`/metadata/${partner.type.value}`);
    };

    //quick nav
    $scope.reporting;
    $scope.search = 0;
    $scope.find = function (reporting) {
      $scope.reporting = reporting;
      $scope.search += 1;
    };

    $scope.loaded = 1;

    $scope.goTo = function (url) {
      return $location.url(url);
    };

    function updatePartner(partner) {
      apiService
        .getReportingsAvailableByYear({
          partner: partner,
        })
        .then(function (result) {
          $scope.data = result;
          reprocess(result, partner);
        });
      apiService
        .getNumberFlows({
          partner: partner,
        })
        .then(function (result) {
          $scope.numberFlows = result;
          $scope.nbFlows = result.filter(function (d) {
            return d.expimp === $scope.chartFlow.type.value;
          });
        });
    }
    function reprocess(data, partner) {
      $scope.rawMinDate = d3.min(data, function (d) {
        return +d.year;
      });
      $scope.rawMaxDate = d3.max(data, function (d) {
        return +d.year;
      });

      var dataFiltered = data.filter(function (d) {
        return d.expimp === $scope.chartFlow.type.value;
      });

      //bilateral proc
      if (partner === "bilateral") {
        dataFiltered.forEach(function (d) {
          d.year = +d.year;
          d.partner = [];
          d.partner_continent = [];
          d.partners.forEach(function (p) {
            d.partner_continent.push(p.split("+")[1]);
            d.partner.push(p.split("+")[0]);
          });
          var partner_continent = d3
            .nest()
            .key(function (d) {
              return d;
            })
            .rollup(function (values) {
              return values.length;
            })
            .map(d.partner_continent);

          var continents = [];
          var continent_keys = d3.keys(partner_continent);
          continent_keys.forEach(function (d) {
            continents.push({
              continent: d,
              number: partner_continent[d],
            });
          });
          d.partner_continent = continents.sort(function (a, b) {
            return b.number - a.number;
          });
        });

        dataFiltered.forEach(function (d) {
          if (d.partners_mirror.length > 0 && d.partner.length > 0) {
            d.partner_intersect = d.partners_mirror.filter(function (value) {
              return d.partner.indexOf(value.split("-")[0]) > -1;
            });
          } else d.partner_intersect = [];
        });
        $scope.flow = dataFiltered;
        $scope.flowEntities = d3
          .nest()
          .key(function (d) {
            return d.reporting;
          })
          .entries(dataFiltered);
        $scope.flowEntities.forEach(function (d) {
          var partner_sum = d3.sum(d.values, function (d) {
            return d.partner.length;
          });
          d.partnerAvg = d3.round(partner_sum / d.values.length);
          d.years = d.values.length;
        });
      } //end proc bilateral

      //bilateral proc
      if (partner === "world") {
        $scope.flow = dataFiltered;

        $scope.flowEntities = d3
          .nest()
          .key(function (d) {
            return d.reporting;
          })
          .entries(dataFiltered);
        $scope.flowEntities.forEach(function (d) {
          d.years = d.values.length;
        });
      } //end proc bilateral

      $scope.entities = $scope.flowEntities.map(function (d) {
        return d.values[0].reporting_id;
      });
      $scope.tableData = dataFiltered;
    }

    updatePartner($scope.partner.type.value);

    /*
     * Display and sort table data + download csv
     */
    $scope.gridOptions = {
      data: "tableData",
      paginationPageSizes: [50],
      paginationPageSize: 50,
      columnDefs: METADATA_TABLE_HEADERS,
      columnFooterHeight: 45,
      enableHorizontalScrollbar: 2,
      enableVerticalScrollbar: 1,
    };

    $scope.download = function () {
      var fileName = "RICardo - Metadata";
      var headers = METADATA_TABLE_HEADERS.map(function (h) {
        return h.displayName;
      });
      var order = METADATA_TABLE_HEADERS.map(function (h) {
        return h.field;
      });
      utils.downloadCSV($scope.tableData, headers, order, fileName);
    };
  },
]);
