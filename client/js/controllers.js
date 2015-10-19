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
      {slug:"world", label:"World view"}
    ]
  })
  .controller('bilateral', function ($scope, $location, reportingEntities, cfSource, cfTarget, apiService, utils, DEFAULT_REPORTING, DEFAULT_PARTNER, TABLE_HEADERS) {

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
        $scope.loading = false;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
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

    $scope.tablePagedData = []

    $scope.gridOptions = {
      data: 'tablePagedData',
      enablePaging: true,
      showFooter: true,
      totalServerItems:'totalServerItems',
      pagingOptions: $scope.pagingOptions,
      enableRowSelection: false,
      footerRowHeight: 45,
      //useExternalPagination: true,
      useExternalSorting: true,
      columnDefs: TABLE_HEADERS,
      sortInfo: {
        fields: ["year", "partner"],
        directions: ["asc"]
      }
    }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.setPagingData($scope.tableData, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
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
          $scope.loading = true;
          sortData($scope.tableData, newVal.fields[0], newVal.directions[0]);
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage); 
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
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
    $scope.entities.sourceEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid===DEFAULT_REPORTING})[0]
    $scope.entities.targetEntity.selected = $scope.reportingEntities.filter(function(e){return e.RICid===DEFAULT_PARTNER})[0]

    function init(sourceID, targetID) {

      apiService
        .getFlows({reporting_ids: sourceID, partner_ids: targetID, with_sources: 1})
        .then(function(result){

          data = result

          $scope.selectedMinDate = 1600                   // Min year as selected by selector or brushing
          $scope.selectedMaxDate = 2000                   // Max year as selected by selector or brushing

          // Consolidate data, add mirror's data to flows array
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
      if(newValue !== oldValue && newValue){
        init(newValue.RICid, $scope.entities.targetEntity.selected.RICid);
      }
    })

    $scope.$watch("entities.targetEntity.selected", function(newValue, oldValue){
      if(newValue !== oldValue && newValue){
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

    /* update Range from date on flows array */
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

    /* Merge mirror array in flows array */
    function mergeMirrorInFlows(data){
      var mirrorFlows_byYear = {} // exchange between countries by year 

      // first step : clean mirror_flows and push data into mirrorFlos_byYear
      data.mirror_flows.forEach(function(d){
        var obj = mirrorFlows_byYear[d.year] || {}
        obj.imp = d.imp || null
        obj.exp = d.exp || null
        mirrorFlows_byYear[d.year] = obj // useless ?
      })

      // second step : add mirror_flow to flow
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
  .controller('country', function ($scope, $location, $timeout, cfSource, cfTarget, cfSourceLine, apiService, reportingEntities, utils, DEFAULT_REPORTING, TABLE_HEADERS) {
    /* all var declarations */
    var data

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;
    
    $scope.filtered = {};
    $scope.filters = [
    { 
      type: {
        value : "all",
        writable: true
      },
      name: {
        value: "All",
        writable: true
      }
    },
    {
      type: {
        value : "city/part_of",
        writable: true
      },
      name: {
        value: "City",
        writable: true
      }
    },
    {
      type: {
        value : "colonial_area",
        writable: true
      },
      name: {
        value: "Colonial",
        writable: true
      }
    },
    {
      type: {
        value : "country",
        writable: true
      },
      name: {
        value: "Country",
        writable: true
      }
    },
    {
      type: {
        value : "geographical_area",
        writable: true
      },
      name: {
        value: "Geo",
        writable: true
      }
    },
    {
      type: {
        value : "group",
        writable: true
      },
      name: {
        value: "Group",
        writable: true
      }
    }];

    $scope.ordered = { 
      type: {
        value :"tot",
        writable: true
      },
      name: {
        value:"Average share on Total",
        writable: true
      }
    };
    $scope.orders = [
    { 
      type: {
        value :"tot",
        writable: true
      },
      name: {
        value:"Average share on Total",
        writable: true
      }
    },
    {
      type: {
        value :"imp",
        writable: true
      },
      name: {
        value:"Average share on Imports",
        writable: true
      }
    },
    {
      type: {
        value :"exp",
        writable: true
      },
      name: {
        value:"Average share on Exports",
        writable: true
      }
    },
    {
      type: {
        value :"name",
        writable: true
      },
      name: {
        value:"Name",
        writable: true
      }
    }];

    $scope.grouped = {};
    $scope.groups = [
    {
      type: {
        value :0,
        writable: true
      },
      name: {
        value:"None",
        writable: true
      }
    },
    {
      type: {
        value :1,
        writable: true
      },
      name: {
        value: "Continent",
        writable: true
      }
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
    $scope.reporting = []
    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];
    $scope.missingData = [];
    $scope.viewTable = 0;
    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']
    $scope.yValue = "total"; 

    // Calling the API
    function init(sourceID, currency) {
      apiService
        .getFlows({reporting_ids: sourceID, original_currency: currency, with_sources: 1})
        .then(function (result) {

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

          $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function(d){return d.type === "country"||d.type === "group"})
          $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function(d){return d.type === "colonial_area"})
          $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function(d){ return d.type === "geographical_area" && d.RICname.indexOf("World ") !== 0})
          //console.log("$scope.reportingGeoEntities", $scope.reportingGeoEntities);
          $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function(d){return d.type === "geographical_area" && d.RICname.indexOf("World ") === 0})
          //console.log("$scope.reportingWorldEntities", $scope.reportingWorldEntities);

          var continents = d3.nest()
            .key(function(d){return d.continent})
            .entries($scope.RICentitiesDD.filter(function(d){return d.continent}))
            .map(function(d){return d.key})

          $scope.reportingContinentEntities = []

          continents.forEach(function(d){
            var elm = {RICname : d, type: "continent", RICid: d }
            $scope.reportingContinentEntities.push(elm)
          })

          /* line chart world */

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
            d.continent = $scope.RICentities[d.partner_id+""].continent
          })
          cfSource.add(data.flows)

          cfSource.partner().filter(function(p){return !/^World/.test(p)});
          var flowsPerYear = cfSource.years().top(Infinity)
          // arrrrrg CFSource m'a tuer ! we need to do a hard copy. 
          flowsPerYear = JSON.parse(JSON.stringify(flowsPerYear))
          
          cfSource.partner().filterAll();
          
          var timelineData = [];

          flowsPerYear.sort(function (a, b){ return d3.ascending(a.key, b.key); })
          flowsPerYear.forEach(function (d){
              var td = $.extend(d.value, {year: (new Date(d.key)).getFullYear()});

              if (!td.exp)
                td.exp = null;
              if (!td.imp)
                td.imp = null;
              if (!td.tot)
                td.tot = null;
              timelineData.push(td);
           });


          $scope.ordered.selected = { 
            type: {
              value :"tot",
              writable: true
            },
            name: {
              value:"Average share on Total",
              writable: true
            }
          };

          $scope.timelineData=timelineData;   
      });
    }

    var initLinechart = function(partners, yValue){
      
        var linechart_flows=[]
        if(partners.length>0)
        {
          var reportingID = $scope.entities.sourceEntity.selected.RICid;

          // array of partner id
          var partner_ids = partners.filter(function (partner){return partner.type!=="continent"}).map(function (partner){return partner.RICid});

          cfSource.partner().filterFunction( function (partner){ return partner_ids.indexOf(partner)!==-1} );

          // save all partners for years available
          linechart_flows=cfSource.year().top(Infinity)
          linechart_flows.sort(function(a, b){ return d3.ascending(a.year, b.year); })
          

          var years = d3.nest()
            .key(function (d) {return d.year})
            .entries(linechart_flows)

          var minDate = d3.min(years, function (years) {return years.key})
          var maxDate = d3.max(years, function (years) {return years.key})



          if (minDate > $scope.selectedMinDate) {
            for (var i = $scope.selectedMinDate; i < minDate; i++) 
            {
              linechart_flows.push({
                reporting_id: linechart_flows[0].reporting_id,
                type: linechart_flows[0].reporting_id,
                partner_id: linechart_flows[0].partner_id, 
                year: i, 
                imp:null,
                exp:null, 
                tot: null , 
                currency: null,
                sources: null
              })
            }   
          }

          if ( maxDate < $scope.selectedMinDate ) {
            for (var i = maxDate; i < $scope.selectedMinDate; i++) 
            {
              linechart_flows.push({
                reporting_id: linechart_flows[0].reporting_id,
                type: linechart_flows[0].reporting_id,
                partner_id: linechart_flows[0].partner_id, 
                year: i, 
                imp:null,
                exp:null, 
                tot: null , 
                currency: null,
                sources: null
              })
            }  
          }

          // linechart_flows.forEach(function(d){

          //           //var year = (new Date(d.year)).getFullYear()
                    

          //           if( d.year>=$scope.selectedMinDate && d.year<=$scope.selectedMaxDate)
          //           {

          //             var value = {};
          //             value.imp = d.imp;
          //             value.exp = d.exp;
          //             value.tot = d.total; 
          //             var td = $.extend({}, initLinechart.value, {
          //               year: d.year,
          //               partner_id: d.partner_id,
          //               imp : d.imp,
          //               exp : d.exp,
          //               tot : d.total
          //             });
          //             console.log("value", value);
          //             if (!td.exp)
          //               td.exp = null;
          //             if (!td.imp)
          //               td.imp = null;
          //             if (!td.tot)
          //               td.tot = null;
          //             td.total=td.tot
          //             delete(td.tot)

          //             linechart_flows.push(td);
          //           }
          // });

          cfSource.partner().filterAll()  

          var continents = partners.filter(function (partner){return partner.type==="continent"});

          continents.forEach(function (continent)
          { 
            cfSource.continent().filterFunction( function(d){ return d===continent.RICid} );
            
            var flows=cfSource.years().top(Infinity)
            flows.sort(function(a, b){ return d3.ascending(a.key, b.key); })
            flows.forEach(function(d){
                    var year = (new Date(d.key)).getFullYear()
                    if( year>=$scope.selectedMinDate && year<=$scope.selectedMaxDate)
                    {
                      console.log("d.value continent", d.value);
                      var td = $.extend({},d.value, {year: year,partner_id:continent.RICid});
                      if (!td.exp)
                        td.exp = null;
                      if (!td.imp)
                        td.imp = null;
                      if (!td.tot)
                        td.tot = null;
                      td.total=td.tot
                      delete(td.tot)

                      linechart_flows.push(td);
                    }
                 });
             cfSource.continent().filterAll()
          });  
        }

        // array of partners (obj)
        $scope.linechartData = d3.nest()
          .key(function (d){return d.partner_id})
          .entries(linechart_flows)

        $scope.linechartData.flowType = yValue;

       
    }

    function updateDateRange(){

      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )

      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )

      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )

      updateTableData();
      initLinechart($scope.reporting);
    }

    function updateTableData(){
      cfSource.year().filter(
        function(d){ 
        return new Date($scope.selectedMinDate-1,1,0) <= d && d< new Date($scope.selectedMaxDate + 1,1,0)}
      );
      $scope.tableData = cfSource.year().top(Infinity);
    }

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newVal, oldVal) {
      if (newVal !== oldVal && newVal[0] != newVal[1]) {
        updateDateRange()
      }
    })

    // First init
    $scope.entities.sourceEntity.selected=$scope.reportingEntities.filter(function (e){return e.RICid===DEFAULT_REPORTING})[0]
    init(DEFAULT_REPORTING);

    /* end initialize */
    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        init(newValue.RICid, $scope.currency)
        updateDateRange()
      }
    })

    // comment these lines to use filter in linechart directive

    // $scope.$watch("filtered.selected", function (newValue, oldValue){
    //   if(newValue !== oldValue){
    //     if(newValue.type.value === "all")
    //       cfSource.type().filterAll()
    //     else {
    //       cfSource.type().filterExact(newValue.type.value)
    //     }
    //     updateTableData();
    //   }
    // })

    /* end directive salvage */

    $scope.pushReporting = function(elm){
      console.log("elm", elm);
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
      console.log("$scope.reporting", $scope.reporting);
      initLinechart($scope.reporting, $scope.yValue);
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) < 0) return;     
      var i = $scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid)
      $scope.lineColors.push(elm["color"])
      $scope.reporting.splice(i, 1);
      if ($scope.reporting.length === 0)
        d3.select("#linechart-world > svg").remove();
      initLinechart($scope.reporting, $scope.yValue);
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

    $scope.$watchCollection('[reporting, yValue]', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        console.log("newValue", newValue);
          initLinechart($scope.reporting, $scope.yValue);
      }
    }, true)


    /* Display and sort table data */
    $scope.loading = false;
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
        $scope.loading = false;
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
      columnDefs: TABLE_HEADERS,
      showFilter: true,
      sortInfo: {
        fields: ["year", "partner"],
        directions: ["asc"]
      }
    }

    /* first load data */ 
    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    /* load data when page changed */
    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    /* watch filter on colomn and changed data */
    $scope.$watch('gridOptions.sortInfo', function (newVal, oldVal) {
        if ($scope.tableData) {
          $scope.loading = true;
          sortData($scope.tableData, newVal.fields[0], newVal.directions[0]);
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage); 
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
          
        }
    }, true);

    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function (h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function (h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };
  })
  .controller('world', function ($scope, $location, $timeout, reportingEntities, reportingColonialEntities, reportingCountryEntities, reportingGeoEntities, reportingContinentEntities, reportingWorldFlows, cfSource, cfTarget, cfSourceLine, apiService, utils, DEFAULT_REPORTING, WORLD_TABLE_HEADERS) {

    var data

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
      type: {
        value :0,
        writable: true
      },
      name: {
        value:"exp",
        writable: true
      }
    },
    {
      type: {
        value :1,
        writable: true
      },
      name: {
        value: "value",
        writable: true
      }
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
    $scope.yValue = "exp"
    $scope.conversion = "sterling";
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
        // Calling the API
    function init() {
      $scope.selectedMinDate = 1600;                   // Min year as selected by selector or brushing
      $scope.selectedMaxDate = 2000;                   // Max year as selected by selector or brushing

      $scope.RICentities = {};

      $scope.reportingCountryEntities = reportingCountryEntities;
      $scope.reportingColonialEntities = reportingColonialEntities;
      $scope.reportingContinentEntities = reportingContinentEntities;
     
      $scope.reporting = []
      $scope.entities.sourceCountryEntity = {}
      $scope.entities.sourceColonialEntity = {}
      $scope.entities.sourceGeoEntity = {}
      $scope.entities.sourceContinentEntity = {}

      $scope.rawMinDate = d3.min( reportingWorldFlows, function(d) { return d.year; })
      $scope.rawMaxDate = d3.max( reportingWorldFlows, function(d) { return d.year; })
      $scope.selectedMinDate = Math.max( $scope.selectedMinDate, $scope.rawMinDate )
      $scope.selectedMaxDate = Math.min( $scope.selectedMaxDate, $scope.rawMaxDate )

      $scope.timelineData=worldFlowsYearsFormat;
      $scope.tableData = worldFlowsYearsFormat;
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
               if (d.type === "country" || d.type === "colonial_area" ) {
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
              if (d.type === "continent") {
                 apiService
                  .getContinentFlows({continents: d.RICname, partner_ids:"Worldbestguess", with_sources:1})
                  .then(function (result) {
                   var yearSelected = [];
                  yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                    $scope.linechartData = [];
                    initLineChart2(linechart_flows, yearSelected, $scope.linechartData, d.RICid, yValue, d.color)
                    
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
            if (d.type === "country" || d.type === "colonial_area" ) {
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
                  $scope.actualCurrency = "pourcent";
               }); 
            }
            if (d.type === "continent") {
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
                  $scope.actualCurrency = "pourcent";
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
            pctArray.push({year: data.year, value:ratio});
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
      initLinechart($scope.reporting, $scope.yValue, $scope.conversion);
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
        initLinechart($scope.reporting, $scope.yValue, $scope.conversion);
        console.log("la");
        updateTableData();
        updateDateRange();
      }
    })

    $scope.$watchCollection('[reporting, yValue, conversion, viewTable]', function (newValue, oldValue){
      if(newValue !== undefined && newValue !== oldValue){
        console.log("ici");
          updateTableData()
          initLinechart($scope.reporting, $scope.yValue, $scope.conversion);
        }
    })

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){
        return d.RICid ? d.RICid : d.RICname }).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
      initLinechart($scope.reporting, $scope.yValue, $scope.conversion);
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.lineColors.push(elm["color"])
      $scope.reporting.splice(i, 1);
      if ($scope.reporting.length === 0)
        d3.select("#linechart-world > svg").remove();
      initLinechart($scope.reporting, $scope.yValue, $scope.conversion);
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
          console.log("newVal", newVal);
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
      console.log("data 2", data);
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
      console.log("data", data);
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
  .controller('ModalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
      $modalInstance.close();
    };

  });
