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
      // {slug:"continent", label:"Continent view"},
      {slug:"world", label:"World view"}
    ]

  })
  .controller('bilateral', function($scope, $location, reportingEntities, cfSource, cfTarget, apiService, utils, DEFAULT_REPORTING, DEFAULT_PARTNER, TABLE_HEADERS) {

    var data

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
    $scope.selectedMinDate = 1600                   // Min year as selected by selector or brushing
    $scope.selectedMaxDate = 2000                   // Max year as selected by selector or brushing
    $scope.rawYearsRange                            // Range of years in data (useful for selectors)
    $scope.rawYearsRange_forInf                     // Range of years in data adapted to inferior bound (useful for selectors)
    $scope.rawYearsRange_forSup                     // Range of years in data adapted to superior bound (useful for selectors)

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
      columnDefs: TABLE_HEADERS
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

    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };

    // ADDENDUM from sprint 06 / 07 / 2015
    $scope.entities.sourceEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
    $scope.entities.targetEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_PARTNER})[0]

    function init(sourceID, targetID) {

      apiService
        .getFlows({reporting_ids: sourceID, partner_ids: targetID, with_sources: 1})
        .then(function(result){

          data = result

          $scope.selectedMinDate = 1600                   // Min year as selected by selector or brushing
          $scope.selectedMaxDate = 2000                   // Max year as selected by selector or brushing

          // Consolidate
          mergeMirrorInFlows(data)

          $scope.timelineData = data.flows

          $scope.rawMinDate = d3.min( data.flows, function(d) { return d.year; })
          $scope.rawMaxDate = d3.max( data.flows, function(d) { return d.year; })
          $scope.selectedMinDate = Math.max( $scope.selectedMinDate, $scope.rawMinDate )
          $scope.selectedMaxDate = Math.min( $scope.selectedMaxDate, $scope.rawMaxDate )

          updateDateRange()
        })
    }

    // Initialization
    init(DEFAULT_REPORTING, DEFAULT_PARTNER);

    $scope.$watch("entities.sourceEntity.selected", function(newValue, oldValue){
      if(newValue != oldValue && newValue){
        init(newValue.RICid, $scope.entities.targetEntity.selected.RICid);
      }
    })

    $scope.$watch("entities.targetEntity.selected", function(newValue, oldValue){
      if(newValue != oldValue && newValue){
        init($scope.entities.sourceEntity.selected.RICid, newValue.RICid);
      }
    })

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newVal, oldVal) {
      if (newVal !== oldVal && newVal[0] != newVal[1]) {
        updateDateRange()
      }
    })

    $scope.$watch('selectedMaxDate', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        updateDateRange()
      }
    })

    function updateDateRange(){

      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )

      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )

      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )

      cfSource.clear()
      cfSource.add(data.flows.filter(function(d){
        return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      }));
      cfTarget.clear()
      cfTarget.add(data.mirror_flows.filter(function(d){
        return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      }));
      $scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity));

    }

    function mergeMirrorInFlows(data){
      var mirrorFlows_byYear = {}
      data.mirror_flows.forEach(function(d){
        var obj = mirrorFlows_byYear[d.year] || {}
        obj.imp = d.imp || null
        obj.exp = d.exp || null
        mirrorFlows_byYear[d.year] = obj
      })

      data.flows.forEach(function(d){
        var mirror = mirrorFlows_byYear[d.year]
        if (mirror) {
          d.imp_mirror = mirror.imp || null
          d.exp_mirror = mirror.exp || null
        } else {
          d.imp_mirror = null
          d.exp_mirror = null
        }
      })
    }
  })
  .controller('country', function($scope, $location, cfSource, cfTarget, cfSourceLine, apiService, reportingEntities, utils, DEFAULT_REPORTING, TABLE_HEADERS) {

    var data

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

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

    $scope.reporting = []

    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];
    $scope.missingData = [];
    $scope.viewTable = 0;

    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']

    $scope.yValue = "total"


    // Calling the API
    function init(sourceID, currency) {

      apiService
        .getFlows({reporting_ids: sourceID, original_currency: currency, with_sources: 1})
        .then(function(result) {

          data = result

          $scope.selectedMinDate = 1600;                   // Min year as selected by selector or brushing
          $scope.selectedMaxDate = 2000;                   // Max year as selected by selector or brushing


          if (cfSource.size() > 0) {
            cfSource.year().filterAll();
            cfSource.clear();
          }

          $scope.actualCurrency = data.flows[0].currency;
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
          $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function(d){return d.type == "geographical_area" && d.RICname.indexOf("World ") === 0})
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

          d3.select("#linechart-world > svg").remove()

          $scope.reporting = []
          //$scope.entities.multiEntity = {}
          $scope.entities.sourceCountryEntity = {}
          $scope.entities.sourceColonialEntity = {}
          $scope.entities.sourceGeoEntity = {}
          $scope.entities.sourceContinentEntity = {}

          $scope.rawMinDate = d3.min( data.flows, function(d) { return d.year; })
          $scope.rawMaxDate = d3.max( data.flows, function(d) { return d.year; })
          $scope.selectedMinDate = Math.max( $scope.selectedMinDate, $scope.rawMinDate )
          $scope.selectedMaxDate = Math.min( $scope.selectedMaxDate, $scope.rawMaxDate )

          data.flows.forEach(function(d){
            d.type = $scope.RICentities[""+d.partner_id].type
          })

        initLinechart($scope.reporting);
      });
    }

    var initLinechart = function(entities){

          if(cfSourceLine.size()>0){
            cfSourceLine.year().filterAll()
            cfSourceLine.clear();
          }

          //scope.RICentities = {}

          var partnerID = $scope.entities.sourceEntity.selected.RICid;


          var values = d3.nest().key(function(d){return d.type}).entries(entities)
          values.forEach(function(d){
            if(d.key != "continent"){
              initEntityLinechart(d.values, partnerID, $scope.startDate, $scope.endDate, $scope.currency)
            }
            else{
              initContinentLinechart(d.values, partnerID, $scope.startDate, $scope.endDate, $scope.currency)
            }
          })

    }

    var initEntityLinechart = function(sourceID, partnerID, startDate, endDate, currency){
      var ids = sourceID.map(function(d){return d.RICid})
      apiService
        .getFlows({partner_ids:ids.join(","), reporting_ids: partnerID, from: startDate, to: endDate, original_currency: currency, with_sources: 1})
        .then(
          function(data){

            var flows = data.flows;

            if(!flows.length){
              $scope.open()
              $scope.reporting.pop()
              return
            }

            // if(cfSourceLine.size()>0){
            //   cfSourceLine.year().filterAll()
            //   cfSourceLine.clear();
            // }


            cfSourceLine.add(flows);

            $scope.linechartData = d3.nest().key(function(d){return d.partner_id}).entries(cfSourceLine.year().top(Infinity))


          },
          function(error) {
            console.log(error)
          }
        )

      }


    var initContinentLinechart = function(sourceID, partnerID, startDate, endDate, currency){
      var ids = sourceID.map(function(d){return d.RICid})
      apiService
        .getContinentFlows({continents:ids.join(","), reporting_ids: partnerID, from: startDate, to: endDate, original_currency: currency, with_sources: 1})
        .then(
          function(data){

            var flows = data.flows;

            if(!flows.length){
              $scope.open()
              $scope.reporting.pop()
              return
            }

            // if(cfSourceLine.size()>0){
            //   cfSourceLine.year().filterAll()
            //   cfSourceLine.clear();
            // }


            cfSourceLine.add(flows);

            $scope.linechartData = d3.nest().key(function(d){return d.partner_id}).entries(cfSourceLine.year().top(Infinity))


          },
          function(error) {
            console.log(error)
          }
        )

      }

    function updateDateRange(){

      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )

      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )

      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )


      cfSource.clear()
      cfSource.add(data.flows.filter(function(d){
        return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      }));

      $scope.startDate = cfSource.year().bottom(1)[0].year
      $scope.endDate = cfSource.year().top(1)[0].year

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
      });

      $scope.missingData = missingData;
      $scope.timelineData = timelineData;
      updateTableData();
    }

    function updateTableData(){
      $scope.tableData = cfSource.year().top(Infinity);
      $scope.tableData.forEach(function(d){
        d.continent = $scope.RICentities[d.partner_id+""].continent
      })
    }

    $scope.$watch('selectedMinDate', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        updateDateRange()
      }
    })

    $scope.$watch('selectedMaxDate', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        updateDateRange()
      }
    })

    // First init
    $scope.entities.sourceEntity.selected=$scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
    init(DEFAULT_REPORTING);

    /* end initialize */
    $scope.$watch("entities.sourceEntity.selected", function(newValue, oldValue){
      if(newValue != oldValue && newValue){
        init(newValue.RICid, $scope.currency)
        updateDateRange()
      }
    })

    $scope.$watch("filter", function(newValue, oldValue){
      if(newValue != oldValue){
        if(newValue == "all")
          cfSource.type().filterAll()
        else cfSource.type().filterExact(newValue)
        updateTableData();
      }
    })

    $scope.$watch("currency", function(newValue, oldValue){
      if(newValue != oldValue){
        init($scope.entities.sourceEntity.selected.RICid, newValue)
        updateDateRange()
      }
    }, true)

    /* end directive salvage */

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
      else if(t == "geographical_area"){
        $scope.entities.sourceGeoEntity.selected = undefined
        $scope.entities.sourceWorldEntity.selected = undefined
      }else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
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

    $scope.$watch('entities.sourceWorldEntity', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.selected) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

    $scope.$watch("reporting", function(newValue, oldValue){
      if(newValue != oldValue && newValue){
          //var partnerID = scope.entities.sourceEntity.selected.RICid;
          //initLinechart(newValue, partnerID, scope.startDate, scope.endDate)
          initLinechart(newValue)
      }
    }, true)

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
      columnDefs: TABLE_HEADERS
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

    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };
  })
  .controller('continent', function($scope, $location, reportingEntities, utils, TABLE_HEADERS) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

    $scope.reportingEntities.forEach(function(d){
      d.RICid = d.RICname
    })

    $scope.entities = {sourceEntity : {}, sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}, sourceWorldEntity : {}}

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
    $scope.reportingWorldEntities = [];
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
      else if(t == "geographical_area"){
        $scope.entities.sourceGeoEntity.selected = undefined
        $scope.entities.sourceWorldEntity.selected = undefined
      }else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
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

    $scope.$watch('entities.sourceWorldEntity', function (newVal, oldVal) {
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
      columnDefs: TABLE_HEADERS
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

    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };
  })
  .controller('world', function($scope, $location, reportingCountryEntities, reportingColonialEntities, reportingGeoEntities, reportingContinentEntities, utils, TABLE_HEADERS) {

    $scope.reportingCountryEntities = reportingCountryEntities;
    $scope.reportingColonialEntities = reportingColonialEntities;
    $scope.reportingGeoEntities = reportingGeoEntities;
    $scope.reportingContinentEntities = reportingContinentEntities;

    //to be fixed: add fake ID to continent entity
    $scope.reportingContinentEntities.forEach(function(d){
      d.RICid = d.RICname
    })

    $scope.entities = {sourceCountryEntity : {}, sourceColonialEntity : {}, sourceGeoEntity : {}, sourceContinentEntity : {}, sourceWorldEntity : {}}
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
      else if(t == "geographical_area"){
        $scope.entities.sourceGeoEntity.selected = undefined
        $scope.entities.sourceWorldEntity.selected = undefined
      }else if(t == "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
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

    $scope.$watch('entities.sourceWorldEntity', function (newVal, oldVal) {
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
      columnDefs: TABLE_HEADERS
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

    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };
  })
  .controller('ModalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
      $modalInstance.close();
    };

  });
