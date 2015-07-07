'use strict';

/* Controllers */

angular.module('ricardo.controllers', [])
  .controller('navbar', function($scope, $location) {

  	$scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    $scope.views = [
      {slug:"bilateral", label:"Bilateral view"},
      {slug:"country", label:"Country view"},
      {slug:"continent", label:"Continent view"},
      {slug:"world", label:"World view"}
    ]

  })
  .controller('bilateral', function($scope, $location, reportingEntities, apiService, DEFAULT_REPORTING, DEFAULT_PARTNER) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

    $scope.alerts = []
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
      };

    $scope.actualCurrency = "sterling pound"
    $scope.tableData = [];
    $scope.missingData = [];
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };
    $scope.viewTable = 0;

    // State
    $scope.timelineData
    $scope.entities = {sourceEntity : {}, targetEntity : {}}
    $scope.rawMinDate                               // Min year in data for the selected pair of countries
    $scope.rawMaxDate                               // Max year in data for the selected pair of countries
    $scope.selectedMinDate = {                      // Min year as selected by selector or brushing
      name:'1857',                                  //   needs a name and value because selectors don't deal with numbers
      value:1857
    }
    $scope.selectedMaxDate = {                      // Max year as selected by selector or brushing
      name:'1938',                                  //   needs a name and value because selectors don't deal with numbers
      value:1938
    }
    $scope.rawYearsRange                            // Range of years in data (useful for selectors)
    $scope.rawYearsRange_forInf                     // Range of years in data adapted to inferior bound (useful for selectors)
    $scope.rawYearsRange_forSup                     // Range of years in data adapted to superior bound (useful for selectors)
    $scope.logMode = false                          // Log scale for the timeline

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
      plugins: [new ngGridCsvExportPlugin({data:'tableData'})]
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.pagingOptions.currentPage = 1
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    // ADDENDUM from sprint 06 / 07 / 2015
    $scope.entities.sourceEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
    $scope.entities.targetEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_PARTNER})[0]

    apiService
      .getFlows({reporting_ids: DEFAULT_REPORTING, partner_ids: DEFAULT_PARTNER})
      .then(function(data){
        console.log('Data loaded', data)

        $scope.timelineData = data.flows

        $scope.rawMinDate = d3.min( data.flows, function(d) { return d.year; })
        $scope.rawMaxDate = d3.max( data.flows, function(d) { return d.year; })
        var selectedMinDate = Math.max( $scope.selectedMinDate.value, $scope.rawMinDate )
        $scope.selectedMinDate = {name: ''+selectedMinDate, value: selectedMinDate}
        var selectedMaxDate = Math.min( $scope.selectedMaxDate.value, $scope.rawMaxDate )
        $scope.selectedMaxDate = {name: ''+selectedMaxDate, value: selectedMaxDate}
        updateDateRange()

      })

    $scope.$watch('selectedMinDate', function (newVal, oldVal) {
      if (newVal.value !== oldVal.value) {
        updateDateRange()
      }
    })

    $scope.$watch('selectedMaxDate', function (newVal, oldVal) {
      if (newVal.value !== oldVal.value) {
        updateDateRange()
      }
    })

    function updateDateRange(){

      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
        .map(function(d){return {value:d, name:''+d}})    // ui-select's model does not deal with numbers

      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate.value )
        .map(function(d){return {value:d, name:''+d}})    // ui-select's model does not deal with numbers

      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate.value + 1, $scope.rawMaxDate + 1 )
        .map(function(d){return {value:d, name:''+d}})    // ui-select's model does not deal with numbers
    }

  })

  .controller('country', function($scope, $location, cfSource, cfTarget, apiService, reportingEntities, DEFAULT_REPORTING) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

    $scope.entities = {sourceEntity : {}, sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}}

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

    $scope.reporting = []

    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.missingData = [];
    $scope.viewTable = 0;

    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']

    $scope.yValue = "total"


    // Calling the API
    function init(sourceID, currency) {
      apiService
        .getFlows({reporting_ids: sourceID, original_currency: currency})
        .then(function(data) {

          var flows = data.flows;

          if (cfSource.size() > 0) {
            cfSource.year().filterAll();
            cfSource.clear();
          }

          $scope.RICentities = {};

          data.RICentities.partners.forEach(function(d){
            $scope.RICentities[""+d.RICid] = {RICname : d.RICname, type: d.type, RICid: d.RICid, continent: d.continent }
          })

          $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
              if(a.RICname < b.RICname) return -1;
              if(a.RICname > b.RICname) return 1;
              return 0;
          })

          $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function(d){return d.type == "country"})
          $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function(d){return d.type == "colonial_area"})
          $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function(d){return d.type == "geographical_area"})
          var continents = d3.nest()
                            .key(function(d){return d.continent})
                            .entries($scope.RICentitiesDD)
                            .map(function(d){return d.key})
                            .filter(function(d){return d})

          $scope.reportingContinentEntities = []

          continents.forEach(function(d){
            var elm = {RICname : d, type: "continent", RICid: d }
            $scope.reportingContinentEntities.push(elm)
          })

          $scope.reporting = []
          //$scope.entities.multiEntity = {}
          $scope.entities.sourceCountryEntity = {}
          $scope.entities.sourceColonialEntity = {}
          $scope.entities.sourceGeoEntity = {}
          $scope.entities.sourceContinentEntity = {}


          flows.forEach(function(d){
            d.type = $scope.RICentities[""+d.partner_id].type
          })

          cfSource.add(flows);

          $scope.startDate = cfSource.year().bottom(1)[0].year
          $scope.endDate = cfSource.year().top(1)[0].year

          $scope.minDate = cfSource.year().bottom(1)[0].year
          $scope.maxDate = cfSource.year().top(1)[0].year

          $scope.selectedMinDate = {name: ''+$scope.minDate, value: $scope.minDate};
          $scope.selectedMaxDate = {name: ''+$scope.maxDate, value: $scope.maxDate};

          $scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
          $scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return !d.key.match(/World*/)})

          var flowsPerYear = cfSource.years().top(Infinity)

          var missingData = [{key:"imp", values:[]},{key:"exp", values:[]}];
          var timelineData = [];

          flowsPerYear.sort(function(a, b){ return d3.ascending(a.key, b.key); })
          flowsPerYear.forEach(function(d){
              var td = $.extend(d.value, {year: (new Date(d.key)).getFullYear()});

              if (!td.exp)
                td.exp = null;
              if (!td.imp)
                td.imp = null;
              if (!td.tot)
                td.tot = null;

              timelineData.push(td);
              missingData[0].values.push({total: d.value.imp, year: d.key})
              missingData[1].values.push({total: d.value.exp, year: d.key})
          })

          $scope.missingData = missingData;
          $scope.timelineData = timelineData;
        });
    }

    // First init
    $scope.entities.sourceEntity.selected=$scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
    init(DEFAULT_REPORTING);

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.length == 1) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.reporting.splice(i, 1);
    }

    $scope.resetDD = function(t){
      if(t == "country"){$scope.entities.sourceCountryEntity.selected = undefined}
      else if(t == "colonial_area"){$scope.entities.sourceColonialEntity.selected = undefined}
      else if(t == "geographical_area"){$scope.entities.sourceGeoEntity.selected = undefined}
      else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
    }

    $scope.$watch('entities.sourceCountryEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
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

    $scope.barchartData = [];
    $scope.tableData = [];
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };

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
      plugins: [new ngGridCsvExportPlugin({data:'tableData'})]
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.pagingOptions.currentPage = 1
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

  })

  .controller('continent', function($scope, $location, reportingEntities) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

    $scope.reportingEntities.forEach(function(d){
      d.RICid = d.RICname
    })

    $scope.entities = {sourceEntity : {}, sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}}

    $scope.filter = "all"
    $scope.order = "tot"
    $scope.actualCurrency = "sterling pound"
    $scope.RICentities = {}
    $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
          if(a.RICname < b.RICname) return -1;
          if(a.RICname > b.RICname) return 1;
          return 0;
      })

    $scope.reporting = []
    $scope.missingData = [];

    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.viewTable = 0;

    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']

    $scope.yValue = "total"

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.length == 1) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.reporting.splice(i, 1);
    }

    $scope.resetDD = function(t){
      if(t == "country"){$scope.entities.sourceCountryEntity.selected = undefined}
      else if(t == "colonial_area"){$scope.entities.sourceColonialEntity.selected = undefined}
      else if(t == "geographical_area"){$scope.entities.sourceGeoEntity.selected = undefined}
      else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
    }

    $scope.$watch('entities.sourceCountryEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
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

    $scope.barchartData = [];
    $scope.tableData = [];
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };

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
      plugins: [new ngGridCsvExportPlugin({data:'tableData'})]
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.pagingOptions.currentPage = 1
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

  })

  .controller('world', function($scope, $location, reportingCountryEntities, reportingColonialEntities, reportingGeoEntities, reportingContinentEntities) {

    $scope.reportingCountryEntities = reportingCountryEntities;
    $scope.reportingColonialEntities = reportingColonialEntities;
    $scope.reportingGeoEntities = reportingGeoEntities;
    $scope.reportingContinentEntities = reportingContinentEntities;

    //to be fixed: add fake ID to continent entity
    $scope.reportingContinentEntities.forEach(function(d){
      d.RICid = d.RICname
    })

    $scope.entities = {sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}}
    $scope.reporting = [];
    $scope.missingData = [];
    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']

    $scope.yValue = "total"
    $scope.actualCurrency = "sterling pound";
    $scope.viewTable = 0;

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.length == 1) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.reporting.splice(i, 1);
    }

    $scope.resetDD = function(t){
      if(t == "country"){$scope.entities.sourceCountryEntity.selected = undefined}
      else if(t == "colonial_area"){$scope.entities.sourceColonialEntity.selected = undefined}
      else if(t == "geographical_area"){$scope.entities.sourceGeoEntity.selected = undefined}
      else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
    }

    $scope.$watch('entities.sourceCountryEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
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

    $scope.tableData = [];
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };

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
      plugins: [new ngGridCsvExportPlugin({data:'tableData'})]
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.pagingOptions.currentPage = 1
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);


  })

  .controller('ModalInstance', function ($scope, $modalInstance) {

  $scope.ok = function () {
    $modalInstance.close();
  };

});
