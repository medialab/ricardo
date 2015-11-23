'use strict';

/* Controllers */

angular.module('ricardo.controllers.world', [])

  .controller('world', function ($scope, $location, $timeout, reportingEntities, reportingWorldFlows, apiService, utils, DEFAULT_REPORTING, WORLD_TABLE_HEADERS) {

    var data

    $scope.nbReportings = reportingWorldFlows;
    $scope.reportingEntities = reportingEntities;

    var worldFlowsYears = d3.nest()
      .key(function (d) { return d.year})
      .entries(reportingWorldFlows);

    var worldFlowsYearsFormat = [];
    worldFlowsYears.forEach( function (d) {
      if (d.key)
        worldFlowsYearsFormat.push({
          reporting_id: "Worldbestguess",
          type: null,
          partner_id: null, 
          year: d.key, 
          imp:d.values[1].flows,
          exp:d.values[0].flows, 
          tot: d.values[1].flows + d.values[0].flows, 
          currency: "sterling",
          sources: d.values[0].sources
        });
    })

    $scope.moded = {};
    $scope.modes = [
    {
      type: {value :0,writable: true},
      name: {value:"exp",writable: true}
    },
    {
      type: {value :1,writable: true},
      name: {value: "value",writable: true}
    }];

    $scope.entities = {sourceEntity : {}, sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}, sourceWorldEntity : {}}

    $scope.filter = "all"
    $scope.order = "tot"
    $scope.currency = 0
    $scope.actualCurrency = "sterling pound"
    $scope.gbContinent = 0;
    $scope.RICentities = {}
    $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
          if(a.RICname < b.RICname) return -1;
          if(a.RICname > b.RICname) return 1;
          return 0;
      })

    $scope.reporting = [];
    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];
    $scope.missingData = [];
    $scope.viewTable = 0;
    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']
    // $scope.yValue = "exp"
    // $scope.conversion = "sterling";
    $scope.tableData = [{
                        reporting_id: null,
                        type: null,
                        partner_id:null,
                        year: null,
                        imp: null,
                        exp: null, 
                        total: null, 
                        currency:null,
                        sources:null
                        }]; // to show table under linechart World
     
    $scope.rawMinDate = 1787                              // Min year in data for the selected pair of countries
    $scope.rawMaxDate = 1938                              // Max year in data for the selected pair of countries
    $scope.selectedMinDate = 1787                         // Min year as selected by selector or brushing
    $scope.selectedMaxDate = 1938                         // Max year as selected by selector or brushing
    $scope.rawYearsRange                                  // Range of years in data (useful for selectors)
    $scope.rawYearsRange_forInf                           // Range of years in data adapted to inferior bound (useful for selectors)
    $scope.rawYearsRange_forSup                           // Range of years in data adapted to superior bound (useful for selectors)

    $scope.linechartCurrency = {}
    $scope.linechartCurrencyChoices = [
      {type: {value: "sterling",writable: true},name: {value: "Sterling",writable: true}},
      {type: {value: "value",writable: true},name: {value: "Percent",writable: true}
    }];

    $scope.linechartFlow = {}
    $scope.linechartFlowChoices = [
      {type: {value: "total",writable: true},name: {value: "Total",writable: true}},
      {type: {value: "exp",writable: true},name: {value: "Exports",writable: true}},
      {type: {value: "imp",writable: true},name: {value: "Imports",writable: true}
    }];

    $scope.linechartCurrency.selected = {type: {value :"sterling",writable: true},name: {value:"Sterling",writable: true}};
    $scope.linechartFlow.selected = {type: {value :"total",writable: true},name: {value:"Total",writable: true}};  

    // Calling the API
    function init() {
      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )
      
      $scope.RICentities = {};

      $scope.reportingCountryEntities = reportingEntities.filter(function (d) {return d.type === "country"});
      $scope.reportingColonialEntities = reportingEntities.filter(function (d) {return d.type === "colonial_area"});
      $scope.reportingGeoEntities = reportingEntities.filter(function (d) {return d.type === "geographical_area"});
      $scope.reportingContinentEntities = reportingEntities.filter(function (d) {return d.type === "continent"});
     
      $scope.reporting = []
      $scope.entities.sourceCountryEntity = {}
      $scope.entities.sourceColonialEntity = {}
      $scope.entities.sourceGeoEntity = {}
      $scope.entities.sourceContinentEntity = {}

      $scope.rawMinDate = d3.min( reportingWorldFlows, function(d) { return d.year; })
      $scope.rawMaxDate = d3.max( reportingWorldFlows, function(d) { return d.year; })
      $scope.selectedMinDate = Math.max( $scope.selectedMinDate, $scope.rawMinDate )
      $scope.selectedMaxDate = Math.min( $scope.selectedMaxDate, $scope.rawMaxDate )

      $scope.timelineData= worldFlowsYearsFormat;
      $scope.tableData = worldFlowsYearsFormat;

      // save World Data in local storage
      localStorage.worldData = JSON.stringify(worldFlowsYearsFormat);    
    }


    init();

    function initTabLineChart(result, yearSelected, type, ric, dateMin, dateMax ) {
      for (var i = dateMin; i <= dateMax; i++) {
        yearSelected.push({
          reporting_id: ric,
          type: type,
          partner_id:"Worldbestguess",
          year: i, 
          imp: null,
          exp: null, 
          total: null, 
          currency:null,
          sources:null
          });                      
      }

      yearSelected.forEach( function (d) {
        result.flows.forEach( function (e) {
          if (d.year === e.year && d.year >= dateMin && d.year <= dateMax) {
            d.exp = e.exp; 
            d.imp = e.imp;
            d.currency = e.currency,
            d.sources = e.sources
            d.total = e.exp + e.imp;
            if (d.total === 0)
              d.total = null;
          }
        })
      })
      return yearSelected;
    }

    function initLineChart2(linechart_flows, yearSelected, linechartData, ric, yValue, color) {
        var countryTab = {};
        countryTab.values = yearSelected;
        countryTab.color = color;
        countryTab.key = ric;
        countryTab.flowType = yValue;
        linechart_flows.push(countryTab);
        linechart_flows.forEach( function (d) {
        linechartData.push(d);        
      })
    }

    var initLinechart = function(partners, yValue, conversion){     
        var linechart_flows=[]
        if (partners.length>0  && conversion === "sterling") {
          partners.forEach( function (d) {
               if (d.type !== "continent" ) {
                apiService
                  .getFlows({reporting_ids: d.RICid, partner_ids:"Worldbestguess", with_sources:1})
                  .then(function (result) {
                    var yearSelected = [];
                    yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                    $scope.linechartData = [];
                    initLineChart2(linechart_flows, yearSelected, $scope.linechartData, d.RICid, yValue, d.color)

                 }); 
                $scope.yValue = yValue;
                $scope.conversion = "sterling";
                $scope.actualCurrency = "sterling pound";
              }
              else {
                 apiService
                  .getContinentFlows({continents: d.RICname, partner_ids:"Worldbestguess", with_sources:1})
                  .then(function (result) {
                    //console.log("d.RICid", d.RICid);
                   var yearSelected = [];
                    yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                    $scope.linechartData = [];
                    initLineChart2(linechart_flows, yearSelected, $scope.linechartData, d.RICname, yValue, d.color)
                    
                 }); 
                $scope.yValue = yValue;
                $scope.conversion = "sterling";
                $scope.actualCurrency = "sterling pound"; 
              }
            })
        }

        var partnersPct = [];
        if (partners.length>0  && conversion === "value")
        {
          partners.forEach( function (d) {
            if (d.type !== "continent" ) {
              apiService
                .getFlows({reporting_ids: d.RICid, partner_ids:"Worldbestguess"})
                .then(function (result) {
                  var yearSelected = [];
                  yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                  var tab = pct(reportingWorldFlows, yearSelected, yValue, d.color);
                  tab.key = d.RICid;
                  partnersPct.push(tab);
                  $scope.linechartData = [];
                  partnersPct.forEach ( function (d) {
                    $scope.linechartData.push(d);
                  });
                  $scope.yValue = yValue;
                  $scope.conversion = "value";
                  $scope.actualCurrency = "percent";
               }); 
            }
            else {
               apiService
                .getContinentFlows({continents: d.RICname, partner_ids:"Worldbestguess"})
                .then(function (result) {
                  var yearSelected = [];
                  yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                  var tab = pct(reportingWorldFlows, yearSelected, yValue, d.color);
                  tab.key = d.RICname;
                  partnersPct.push(tab);
                  $scope.linechartData = [];
                  partnersPct.forEach ( function (d) {
                    $scope.linechartData.push(d);
                  });
                  $scope.yValue = yValue;
                  $scope.conversion = "value";
                  $scope.actualCurrency = "percent";
                }); 

            }
          })
        }
    }

    function pct(reportingWorldFlows, data, yValue, color) {
      var worldFlowsYears = d3.nest()
      .key(function (d) { return d.year})
      .entries(reportingWorldFlows);

      var worldFlowsYearsFormat = [];
      worldFlowsYears.forEach( function (d) {
        if (d.key)
          worldFlowsYearsFormat.push({
            reporting_id: "Worldbestguess",
            type: null,
            partner_id: null, 
            year: d.key, 
            imp:d.values[1].flows,
            exp:d.values[0].flows, 
            total:d.values[1].flows + d.values[0].flows, 
            currency: "sterling",
            sources: d.values[0].sources
          });
      })

      var pctArray = [];
      data.forEach( function (data) {
        worldFlowsYearsFormat.forEach(function (d) {
          if (data.year == d.year) // == because it's str vs integer
          {
            var ratio ;
            if (data[yValue] === null || data[yValue] === 0)
              ratio = null;
            else {
              ratio = data[yValue] / d[yValue] * 100;
            }
            pctArray.push({reporting_id: data.reporting_id, year: data.year, value:ratio});
          }
        })
      })
      var pctArrayInit = {};  // object to save pct arrays
      pctArrayInit.values = pctArray
      pctArrayInit.color = color;
      pctArrayInit.type = "value";
      pctArrayInit.flowType = yValue;
      return pctArrayInit;
    }

    function updateDateRange(){
      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )

      updateTableData();
      initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
    }

    function updateTableData(){
      $scope.tableData = [];
      $scope.tableData = worldFlowsYearsFormat;
      $scope.tableData.concat(worldFlowsYearsFormat);

      if ($scope.linechartData) {

        var len = $scope.linechartData.length;
        for (var i = 0; i < len; i++) {
          $scope.tableData = $scope.tableData.concat($scope.linechartData[i].values);
        }
      }
    }

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newVal, oldVal) {
      if (newVal !== undefined && newVal !== oldVal && newVal[0] != newVal[1]) {
        initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
        updateTableData();
        updateDateRange();
      }
    })

    // $scope.$watchCollection('[reporting, linechartFlow.selected, linechartCurrency.selected, viewTable]', function (newValue, oldValue){
    //   if(newValue !== oldValue && newValue){
    //     console.log("newValue world", newValue);
    //     initLinechart($scope.reporting, newValue[1].type.value, newValue[2].type.value);
    //   }
    // }, true)

    $scope.$watch('reporting', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
        updateTableData();
        //updateDateRange();
      }
    }, true)

    $scope.$watch('linechartFlow.selected', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        initLinechart($scope.reporting, newValue.type.value, $scope.linechartCurrency.selected.type.value);
      }
    }, true)

    $scope.$watch('linechartCurrency.selected', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, newValue.type.value);
      }
    }, true)

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){
        return d.RICid ? d.RICid : d.RICname }).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
      initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.lineColors.push(elm["color"])
      $scope.reporting.splice(i, 1);
      if ($scope.reporting.length === 0)
        d3.select("#linechart-world-container>svg").remove();
      initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
    }

    $scope.resetDD = function(t){
      if(t === "country"){$scope.entities.sourceCountryEntity.selected = undefined}
      else if(t === "colonial_area"){$scope.entities.sourceColonialEntity.selected = undefined}
      else if(t === "geographical_area"){
        $scope.entities.sourceGeoEntity.selected = undefined
        $scope.entities.sourceWorldEntity.selected = undefined
      }else if(t === "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
    }

    $scope.$watch('entities.sourceCountryEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected);
        }
    }, true);

    $scope.$watch('entities.sourceColonialEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

    $scope.$watch('entities.sourceGeoEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

    $scope.$watch('entities.sourceContinentEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

    $scope.$watch('entities.sourceWorldEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

     /* Display and sort table data + download csv */
    
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };

    function sortData(data, field, direction) {
      var dataS = data
      if (dataS) {
        dataS.sort(function (a, b) {
              if (direction === "asc") {
            return a[field]> b[field]? 1 : -1;
          } else {
            return a[field]> b[field]? -1 : 1;
          }
        }) 
      }
    }

    $scope.setPagingData = function(data, pageSize, page){
        var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.tablePagedData = pagedData;
        $scope.totalServerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.tablePagedData = []
    $scope.gridOptions = {
      data: 'tablePagedData',
      enablePaging: true,
      showFooter: true,
      totalServerItems:'totalServerItems',
      pagingOptions: $scope.pagingOptions,
      enableRowSelection: false,
      footerRowHeight: 45,
      columnDefs: WORLD_TABLE_HEADERS,
      showFilter: true,
      sortInfo: {
        fields: ["year", "partner"],
        directions: ["asc"]
      }
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    /* watch filter on colomn and changed data */
    $scope.$watch('gridOptions.sortInfo', function (newVal, oldVal) {
        if ($scope.tableData) {
          sortData($scope.tableData, newVal.fields[0], newVal.directions[0])
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage); 
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
        }
    }, true);

    $scope.download = function() {
      var headers = WORLD_TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = WORLD_TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };
  })