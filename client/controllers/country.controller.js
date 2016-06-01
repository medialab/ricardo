'use strict';

/*
 * Country view Controller : api call and data manipulation to serve four
 * visualisations (dualtimeline, brushing, partner histogram & linechart)
 */

angular.module('ricardo.controllers.country', [])

  .controller('country', ["$scope", "$location", "cfSource", "cfTarget",
    "cfSourceLine", "apiService", "lineChartService", "dataTableService", "utils",
    "countryService", "countryLines", "reportingEntities", "DEFAULT_REPORTING", "TABLE_HEADERS",
    function ($scope, $location, cfSource, cfTarget,
    cfSourceLine, apiService, lineChartService, dataTableService, utils, countryService,
    countryLines, reportingEntities, DEFAULT_REPORTING, TABLE_HEADERS) {
    /*
     * Message error if no data
     */
    $scope.ok = function () {
      $scope.missing = "0";
    };

    $scope.okPartner = function () {
      $scope.missingPartner = 0;
    };

    /*
     * Partners Histo filter
     */

    $scope.filters = [
      {type: {value: "all", writable: true },
       name: {value: "All",writable: true}},
      {type: {value: "city/part_of",writable: true},
       name: {value: "City",writable: true}},
      {type: {value: "colonial_area",writable: true},
       name: {value: "Colonial",writable: true}},
      {type: {value: "country",writable: true},
       name: {value: "Country",writable: true}},
      {type: {value: "geographical_area",writable: true},
       name: {value: "Geo",writable: true}},
      {type: {value: "group",writable: true},
       name: {value: "Group",writable: true}
    }];
    $scope.filtered =$scope.filters[0];

    $scope.ordered = {
      type: {value: "tot",writable: true},
      name: {value: "Average share on Total",writable: true}
    };
    $scope.orders = [
      {type: {value: "tot",writable: true},
       name: {value: "Average share on Total",writable: true}},
      {type: {value: "imp",writable: true},
       name: {value: "Average share on Imports",writable: true}},
      {type: {value: "exp",writable: true},
       name: {value: "Average share on Exports",writable: true}},
      {type: {value: "name",writable: true},
       name: {value: "Name",writable: true}}
      ];


    $scope.groups = [
      {type: {value: 0,writable: true},
       name: {value: "None",writable: true}},
      {type: {value: 1,writable: true},
       name: {value: "Continent",writable: true}
    }];
    $scope.grouped =  $scope.groups[0];


    // $scope.sorts = [
    //   {type: {value: "name",writable: true},
    //    name: {value: "Name",writable: true}},
    //   {type: {value: "average",writable: true},
    //    name: {value: "Average share",writable: true}
    // }];
    // $scope.sorted = $scope.sorts[1];

    $scope.linechartCurrency = {}
    $scope.linechartCurrencyChoices = [
      {type: {value: "sterling",writable: true},
       name: {value: "Sterling",writable: true}},
      {type: {value: "value",writable: true},
       name: {value: "Percent",writable: true}
    }];

    $scope.linechartFlow = {}
    $scope.linechartFlowChoices = [
      {type: {value: "total",writable: true},
       name: {value: "Total",writable: true}},
      {type: {value: "exp",writable: true},
       name: {value: "Exports",writable: true}},
      {type: {value: "imp",writable: true},
       name: {value: "Imports",writable: true}
    }];

    /*
     * All var declarations
     */
    var data
    $scope.reportingEntities = reportingEntities;
    $scope.messagePercent = 0;
    $scope.entities = {
      sourceEntity : {},
      sourceCountryEntity : {},
      sourceColonialEntity : {},
      sourceGeoEntity : {},
      sourceContinentEntity : {},
      sourceWorldEntity : {},
      sourceCountryEntity1 : {},

    }

    // $scope.RICentities = {}
    // $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
    //     if(a.RICname < b.RICname) return -1;
    //     if(a.RICname > b.RICname) return 1;
    //     return 0;
    // })

    /*
     * Arrays of entities for linechart
     */

    $scope.reporting = []
    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];
    $scope.reportingCountryEntities1 = [];

    /*
     * Linecharts default config
     */

    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']
    $scope.linechartCurrency = {type: {value : "sterling", writable: true},
                                name: {value: "Sterling", writable: true}};
    $scope.linechartFlow = {type: {value: "total", writable: true},
                            name: {value: "Total", writable: true}};

    $scope.missingData = [];
    /*
     * Trigger to show or hide data table
     */
    $scope.viewTable = 0;

    $scope.yValue = "total";
    $scope.conversion = "sterling";
    $scope.filter = "all"
    $scope.order = "tot"
    $scope.currency = 0
    $scope.actualCurrency = "sterling pound"


    /*
     * First init with local storage
     */
     if (localStorage.sourceEntitySelected) {
      try {
        $scope.entities.sourceEntity.selected = JSON.parse(localStorage.getItem('sourceEntitySelected'));
        init($scope.entities.sourceEntity.selected.RICid, $scope.currency);
        }
      catch (e) {
        $scope.entities.sourceEntity.selected=$scope.reportingEntities.filter(function (e){
          return e.RICid===DEFAULT_REPORTING})[0]
        init(DEFAULT_REPORTING, $scope.currency);
      }
     }
     else {
      $scope.entities.sourceEntity.selected=$scope.reportingEntities.filter(function (e){
        return e.RICid===DEFAULT_REPORTING})[0]
      init(DEFAULT_REPORTING, $scope.currency);
     }

    function initTabLineChart(result, yearSelected, type, ric) {
      for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
        yearSelected.push({
          reporting_id:$scope.entities.sourceEntity.selected.RICid,
          type: type,
          partner_id:ric,
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
          if (d.year === e.year) {
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
    /*
     * Calling the API to init country selection
     */
    function init(sourceID, currency) {
      apiService
        .getFlows({
          reporting_ids: sourceID,
          with_sources:1
        })
        .then(function (data) {
          var dates = data.flows.map(function (d) { return d.year})

          $scope.selectedMinDate = d3.min(dates);
          $scope.selectedMaxDate = d3.max(dates);
          data.flows = data.flows.filter(function (d) { if (d.imp || d.exp !== 0) return d})
          $scope.tableData = data.flows;

          if (cfSource.size() > 0) {
            cfSource.year().filterAll();
            cfSource.clear();
          }

          $scope.actualCurrency = data.flows[0].currency;
          $scope.RICentities = {};

          data.RICentities.partners.forEach(function(d){
            $scope.RICentities[""+d.RICid] = {
              RICname : d.RICname,
              type: d.type,
              RICid: d.RICid,
              continent: d.continent }
            })
          $scope.RICentitiesDD=[...data.RICentities.partners]
          $scope.RICentitiesDD.forEach(function(d){
            if(d.RICname.indexOf("World ")!== 0) d.RICname=d.RICname+"["+d.type+"]";
          })
          // $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
          //     if(a.RICname < b.RICname) return -1;
          //     if(a.RICname > b.RICname) return 1;
          //     return 0;
          // })  

          /*
           *  Init all entities by types filters for linechart viz
           */

          $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "country"})
          $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "colonial_area"})
          $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "geographical_area" && d.RICname.indexOf("World ") !== 0})
          $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "geographical_area" && d.RICname.indexOf("World ") === 0})

           $scope.reportingCountryEntities1= $scope.RICentitiesDD.filter(function(d){
            return d.RICname.indexOf("World ") !== 0})
           
          /*
           * Special methods for continent
           */

          var continents = d3.nest()
            .key(function(d){return d.continent})
            .entries($scope.RICentitiesDD.filter(function(d){return d.continent}))
            .map(function(d){return d.key})

          $scope.reportingContinentEntities = []

          continents.forEach(function(d){
            var elm = {RICname : d, type: "continent", RICid: d }
            $scope.reportingContinentEntities.push(elm)
          })

          /*
           * Line chart world
           */

          $scope.reporting = []
          $scope.entities.sourceCountryEntity = {}
          $scope.entities.sourceColonialEntity = {}
          $scope.entities.sourceGeoEntity = {}
          $scope.entities.sourceContinentEntity = {}
          $scope.entities.sourceWorldEntity = {}

          $scope.rawMinDate = d3.min( data.flows, function(d) {return d.year; })
          $scope.rawMaxDate = d3.max( data.flows, function(d) {return d.year; })


          // $scope.selectedMinDate = parseInt(localStorage.getItem('selectedMinDate'));
          // $scope.selectedMaxDate = parseInt(localStorage.getItem('selectedMaxDate'));

          /*
           * Check if dates were in localstorage
           */
          // var minDate = parseInt(localStorage.getItem('selectedMinDate'));
          // var maxDate = parseInt(localStorage.getItem('selectedMaxDate'));
          // $scope.selectedMinDate = minDate ?
          //   minDate : Math.max( $scope.selectedMinDate, $scope.rawMinDate );
          // $scope.selectedMaxDate = maxDate ?
          //   maxDate : Math.min( $scope.selectedMaxDate, $scope.rawMaxDate );

          $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
          $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
          $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )
          /*
           * Build data for timeline
           */
          data.flows.forEach(function(d){
            d.type = $scope.RICentities[""+d.partner_id].type
            d.continent = $scope.RICentities[d.partner_id+""].continent
          })
          cfSource.add(data.flows)

          // delete world flows, maybe api action ?
          cfSource.partner().filter(function(p){return !/^World/.test(p)});
          var flowsPerYear = cfSource.years().top(Infinity)
          // arrrrrg CFSource kill me ! we need to do a hard copy.
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

          $scope.timelineData=timelineData;
          $scope.$apply();
          /*
           * Display filters selection and init partner histogram
           */
          $scope.ordered = {type: {value :"tot",writable: true},
                            name: {value:"Average share on Total",writable: true}};
          $scope.grouped = {type: {value :0,writable: true},
                            name: {value:"None",writable: true}};
          $scope.filtered = {type: {value :"all",writable: true},
                            name: {value:"All",writable: true}};
          // $scope.sorted = { type: {value :"average",writable: true},
          //                   name: {value:"Average share",writable: true}};

          initPartnerHisto($scope.tableData)

          /*
           * Save all object in localStorage
           */
          localStorage.removeItem('selectedMinDate');
          localStorage.removeItem('selectedMaxDate');
          localStorage.removeItem('sourceEntitySelected');
          localStorage.setItem('selectedMinDate', JSON.stringify($scope.selectedMinDate));
          localStorage.setItem('selectedMaxDate', JSON.stringify($scope.selectedMaxDate));
          localStorage.setItem('sourceEntitySelected', JSON.stringify($scope.entities.sourceEntity.selected));
      });
    }


    /*
     * Triggers entity selected and dates
     */
    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] != newValue[1]) {
        // update date selected
        $scope.selectedMinDate = newValue[0];
        $scope.selectedMaxDate = newValue[1];
        // update local storage
        localStorage.removeItem('selectedMinDate');
        localStorage.removeItem('selectedMaxDate');
        localStorage.selectedMinDate = newValue[0];
        localStorage.selectedMaxDate = newValue[1];

        updateDateRange();
        // initLinechart($scope.reporting, $scope.linechartFlow.type.value,
        //   $scope.linechartCurrency.type.value);
        initPartnerHisto($scope.tableData);
      }
    })

    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue){
      // console.log("watch entity");
      if(newValue !== oldValue && newValue){
        // update local storage
        localStorage.removeItem('sourceEntitySelected');
        localStorage.sourceEntitySelected = JSON.stringify(newValue);

        init(newValue.RICid, $scope.currency)
        updateDateRange()
      }
    })


    /*
     * Update data table
     */

    function updateDateRange(){
      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )

      updateTableData();
      // initLinechart($scope.reporting, $scope.linechartFlow.type.value,
      //   $scope.linechartCurrency.type.value);
    }

    function updateTableData(){
      //filter tableData by date
      var tableData=$scope.tableData.filter(function(d){
         return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
      });

      var partner_selected=$scope.reporting.map(function(d){return d.RICid})
      var tableDataSources=tableData;
      if(partner_selected.length>0){
        tableDataSources=[]
        $scope.reporting.forEach(function(r){
          if(r.type!=="continent") var dataFiltered=tableData.filter(function(d){ return d.partner_id===r.RICid});
          else var dataFiltered=tableData.filter(function(d){
            return $scope.RICentities[""+d.partner_id].continent===r.RICid});
          tableDataSources=tableDataSources.concat(dataFiltered)
        })
      }
      $scope.tableDataSources=tableDataSources;
      //remove duplicates of array of objects

      // if(partner_selected.length>0){
      //   $scope.tableDataSources=$scope.tableDataSources.filter(function(d){
      //     if()return partner_selected.indexOf(d.partner_id) > -1;
      //   });
      // }

      var missing;
      var allExpNull = $scope.tableDataSources.every(function (d) {
        return d.exp === null;
      })

      var allImpNull = $scope.tableDataSources.every(function (d) {
        return d.imp === null;
      })

      if (allExpNull && allImpNull) {
        missing = "1";
      }
      else {
        missing = "0";
      }

      // var onlyWorld = $scope.tableDataSources.every(function (d) {
      //   return d.continent === "World";
      // })

      // if (onlyWorld)
      //   missing = "1";
      $scope.missing = missing;

      // if ($scope.linechartData) {
      //   console.log($scope.linechartData);
      //   $scope.tableDataSources=[];
      //   var len = $scope.linechartData.length;
      //   for (var i = 0; i < len; i++) {
      //     $scope.tableDataSources = $scope.tableDataSources.concat($scope.linechartData[i].values);
      //   }
      // }

    }

    /*
     * Push item in array to display line chart
     */

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
      initLinechart($scope.reporting, $scope.linechartFlow.type.value,
        $scope.linechartCurrency.type.value);
      updateTableData();
    }

    /*
     * Remove item of the array of reporting to display line chart world
     */
    $scope.removeReporting = function(elm){
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid)
      $scope.lineColors.push(elm["color"])
      $scope.reporting.splice(i, 1);
      d3.select("#linechart-world-container > svg").remove();
      initLinechart($scope.reporting, $scope.linechartFlow.type.value,
        $scope.linechartCurrency.type.value);
      updateTableData();
    }

    /*
     * Reset view filters to undefined
     */

    $scope.resetDD = function(t){
      $scope.entities.sourceCountryEntity1.selected = undefined
      $scope.entities.sourceWorldEntity.selected = undefined
      $scope.entities.sourceContinentEntity.selected = undefined
      // if(t === "country"){$scope.entities.sourceCountryEntity.selected = undefined}
      // if(t === "colonial_area"){$scope.entities.sourceColonialEntity.selected = undefined}
      // if(t === "geographical_area"){
      //   $scope.entities.sourceGeoEntity.selected = undefined
      //   $scope.entities.sourceWorldEntity.selected = undefined
      // }
      // if(t === "continent"){$scope.entities.sourceContinentEntity.selected = undefined}
    }


    function buildIndexYears(data) {
      var indexYears = {};

      d3.nest()
        .key(function(d){ return d.year })
        .rollup(countryService.rollupYears)
        .entries(data)
        .forEach(function(y){
          indexYears[y.key] = y.values;
        })
        return indexYears
    }

    /*
     * Partners histo triggers functions and init function partner Histo
     */

    function initPartnerHisto(data) {
      var data = [];
      var temp = $scope.tableData;
      // Select data between date selected
      temp.forEach( function (d) {
        if (d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate) {
          data.push(d);
        }
      })

      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;

      // filter data without world reference
      data = data.filter(function(p){ return !/^World/.test(p.partner_id)})

      /*
       * Here we lost type information of entity. Need to use addTypePartner().
       */

      var partners = d3.nest()
        .key(function(d){ return d[$scope.grouped.type.value ? "continent" : "partner_name"] })
        .key(function(d){ return d.year })
        .rollup(countryService.rollupYears)
        .entries(data)

      partners = countryService.addTypePartner(partners, data);
      partners = countryService.valuesToPartners(partners, indexYears);

      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) {
          return d.type === $scope.filtered.type.value
        })
      partners = partners.sort(function(a,b){
        if ($scope.ordered.type.value === 'name')
          return d3.ascending(a.key, b.key);
        else {
          return d3.descending(a["avg_" + $scope.ordered.type.value ],
                               b["avg_" + $scope.ordered.type.value ]);
        }
      });
      $scope.partnersData = partners
    }

    $scope.changeGroup = function (group) {
      $scope.grouped = group;

      var data = $scope.tableData;
      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;

      data=data.filter(function(p){ return !/^World/.test(p.partner_id)})

      var partners = d3.nest()
        .key(function(d){
          return d[group.type.value ? "continent" : "partner_name"]
        })
        .key(function(d){ return d.year })
        .rollup(countryService.rollupYears)
        .entries(data)

      partners = countryService.addTypePartner(partners, data);
      partners = countryService.valuesToPartners(partners, indexYears);


      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) {
          return d.type === $scope.filtered.type.value
        })

      partners = partners.sort(function(a,b){
        if ($scope.ordered.type.value === 'name')
          return d3.ascending(a.key, b.key);
        else {
          return d3.descending(a["avg_" + $scope.ordered.type.value],
                               b["avg_" + $scope.ordered.type.value]);
        }
      });

      $scope.partnersData = partners

      if (partners.length === 0)
        $scope.missingPartner = 1;
    }

    //conflict with changeOrder
    // $scope.changeSort = function (sort) {
    //     $scope.sorted = sort;
    //     var data = [];

    //     var temp = $scope.tableData;

    //     temp.forEach( function (d) {
    //       if (d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate) {
    //         data.push(d);
    //       }
    //     })
    //     var indexYears = buildIndexYears(data);
    //     $scope.indexYears = indexYears;

    //     data=data.filter(function(p){ return !/^World/.test(p.partner_id)})

    //     var partners = d3.nest()
    //       .key(function(d){
    //         return d[$scope.grouped.type.value ? "continent" : "partner_id"]
    //       })
    //       .key(function(d){ return d.year })
    //       .rollup(countryService.rollupYears)
    //       .entries(data)

    //     partners = countryService.addTypePartner(partners, data);
    //     partners = countryService.valuesToPartners(partners, indexYears);

    //     if ($scope.filtered.type.value !== "all")
    //       partners = partners.filter(function (d) {
    //         return d.type === $scope.filtered.type.value
    //       })

    //     partners = partners.sort(function(a,b){
    //       if (sort.type.value === 'name')
    //         return d3.ascending(a.key, b.key);
    //       else {
    //         return d3.descending(a["avg_" + $scope.ordered.type.value],
    //                              b["avg_" + $scope.ordered.type.value]);
    //       }
    //     });

    //     $scope.partnersData = partners
    //     if (partners.length === 0)
    //       $scope.missingPartner = 1;
    // }

    $scope.changeOrder = function (order) {
        $scope.ordered = order;

        var data = $scope.tableData;
        var indexYears = buildIndexYears(data);
        $scope.indexYears = indexYears;


        data=data.filter(function(p){ return !/^World/.test(p.partner_id)})

        var partners = d3.nest()
          .key(function(d){
            return d[$scope.grouped.type.value ? "continent" : "partner_name"]
          })
          .key(function(d){ return d.year })
          .rollup(countryService.rollupYears)
          .entries(data)

        partners = countryService.addTypePartner(partners, data);
        partners = countryService.valuesToPartners(partners, indexYears);

        if ($scope.filtered.type.value !== "all")
          partners = partners.filter(function (d) {
            return d.type === $scope.filtered.type.value
          })

        partners = partners.sort(function(a,b){
          if ($scope.ordered.type.value === 'name')
            return d3.ascending(a.key, b.key);
          else {
            return d3.descending(a["avg_" + order.type.value],
                                 b["avg_" + order.type.value]);
          }
        });

        $scope.partnersData = partners
        if (partners.length === 0)
          $scope.missingPartner = 1;
    }

    $scope.changeFilter = function (filter) {
        $scope.filtered = filter;

        var data = $scope.tableData;
        var indexYears = buildIndexYears(data);
        $scope.indexYears = indexYears;

        data=data.filter(function(p){ return !/^World/.test(p.partner_id)})

        var partners = d3.nest()
          .key(function(d){
            return d[$scope.grouped.type.value ? "continent" : "partner_id"]
          })
          .key(function(d){ return d.year })
          .rollup(countryService.rollupYears)
          .entries(data)

        partners = countryService.addTypePartner(partners, data);
        partners = countryService.valuesToPartners(partners, indexYears);

        if (filter.type.value !== "all")
          partners = partners.filter(function (d) {
            return d.type === filter.type.value
          })

        partners = partners.sort(function(a,b){
          if ($scope.ordered.type.value === 'name')
            return d3.ascending(a.key, b.key);
          else {
            return d3.descending(a["avg_" + $scope.ordered.type.value],
                                 b["avg_" + $scope.ordered.type.value]);
          }
        });

        $scope.partnersData = partners
        if (partners.length === 0)
          $scope.missingPartner = 1;
    }

    /*
     *  Linechart triggers
     */

    // $scope.$watch('reporting', function (newValue, oldValue){
    //   if(newValue !== oldValue && newValue){
    //     initLinechart($scope.reporting, $scope.linechartFlow.type.value,
    //       $scope.linechartCurrency.type.value);
    //     updateTableData()
    //   }
    // }, true)

    // $scope.$watch('linechartData', function (newValue, oldValue){
    //    if(newValue !== oldValue){
    //       updateTableData();
    //   }
    // }, true)

    $scope.change = function (item) {
      $scope.pushReporting(item)
    }
    $scope.changeCountry = function (country) {
      $scope.pushReporting(country)
    }

    $scope.changeColonial = function (colonial) {
      $scope.pushReporting(colonial)
    }

    $scope.changeGeo = function (geo) {
      $scope.pushReporting(geo)
    }

    $scope.changeContinent = function (continent) {
      $scope.pushReporting(continent)
    }

    $scope.changeWorld = function (world) {
      $scope.pushReporting(world)
    }

    $scope.changeCurrency = function (currency) {
      initLinechart($scope.reporting, $scope.linechartFlow.type.value,
        currency.type.value);
      $scope.linechartCurrency = currency;
      $scope.messagePercent= currency.type.value==="value";
    }

    $scope.changeFlow = function (flow) {
      initLinechart($scope.reporting, flow.type.value,
        $scope.linechartCurrency.type.value);
      $scope.linechartFlow = flow;
    }

    /*
     * linechart functions
     */
    function initLineChart2(linechart_flows, yearSelected, ric, yValue, color) {
      var linechartData=[]
      var countryTab = {};
      countryTab.values = yearSelected;
      countryTab.color = color;
      countryTab.key = ric;
      countryTab.flowType = yValue;
      linechart_flows.push(countryTab);
      linechart_flows.forEach( function (d) {
        linechartData.push(d);
      })
      return linechartData;
    }

    function initLinechart(partners, yValue, conversion){
        var linechart_flows=[]
        $scope.yValue = yValue;
        if(partners.length>0 && conversion === "sterling" )
        {
          partners.forEach( function (d) {
          if (d.type !== "continent") {
            apiService
              .getFlows({
                reporting_ids: $scope.entities.sourceEntity.selected.RICid,
                partner_ids: d.RICid,
                with_sources:1
              })
              .then(function (result) {
                var yearSelected = [];
                // yearSelected = lineChartService.initTabLineChart(result,
                //   yearSelected, d.type, d.RICid, $scope.selectedMinDate,
                //   $scope.selectedMaxDate)
                yearSelected = initTabLineChart(result, yearSelected, d.type,
                    d.RICid)
                var linechartData=initLineChart2(linechart_flows, yearSelected,
                    d.RICid, yValue, d.color)
                if(linechartData.length===partners.length) $scope.linechartData=linechartData;
             });
            // factorise these lines
            // $scope.yValue = yValue;
            // $scope.linechartCurrency= {
            //   type: {value :"sterling",writable: true},
            //   name: {value:"Sterling",writable: true}};
          }
          else {
             apiService
              .getContinentFlows({
                continents: d.RICid ,
                reporting_ids: $scope.entities.sourceEntity.selected.RICid
              })
              .then(function (result) {
               var yearSelected = [];
              // yearSelected = lineChartService.initTabLineChart(result, yearSelected,
              //   d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)
               yearSelected = initTabLineChart(result, yearSelected, d.type,
                    d.RICid)
              var linechartData=initLineChart2(linechart_flows, yearSelected,
                    d.RICid, yValue, d.color)
               if(linechartData.length===partners.length) $scope.linechartData=linechartData;

             });
            // $scope.yValue = yValue;
            // $scope.linechartCurrency = {
            //   type: {value :"sterling",writable: true},
            // name: {value:"Sterling",writable: true}};
            // $scope.messagePercent = 0;
          }
        })
    
      }

        // var partnersPct = [];
        var linechartData=[];
        if (partners.length>0  && conversion === "value")
        {
          partners.forEach( function (d) {
            if (d.type !== "continent") {
              apiService
                  .getFlows({
                    reporting_ids: $scope.entities.sourceEntity.selected.RICid,
                    partner_ids:d.RICid,
                    with_sources:1
                  })
                  .then(function (result) {
                    var yearSelected = [];
                    // yearSelected = lineChartService.initTabLineChart(result,
                    //   yearSelected, d.type, d.RICid, $scope.selectedMinDate,
                    //   $scope.selectedMaxDate)
                    yearSelected = initTabLineChart(result, yearSelected, d.type,
                      d.RICid)
                    changeInPercent($scope.entities.sourceEntity.selected.RICid,yValue,
                      yearSelected, d.color,function(tab) {
                      tab.key = d.RICid;
                      linechartData.push(tab)
                     
                    if(linechartData.length===partners.length) $scope.linechartData=linechartData;
                    // console.log($scope.linechartData)
                    // $scope.yValue = yValue;
                    // $scope.linechartCurrency = {
                    //   type: {value :"value",writable: true},
                    //   name: {value:"Percent",writable: true}
                    // };
                    // $scope.actualCurrency = "percent";
                    // $scope.messagePercent = 1;
                  });
                })
            }
            else {
              apiService
                  .getContinentFlows({
                    continents: d.RICid,
                    reporting_ids:$scope.entities.sourceEntity.selected.RICid
                  })
                  .then(function (result) {
                   var yearSelected = [];
                    // yearSelected = lineChartService.initTabLineChart(
                    //   result, yearSelected, d.type, d.RICname, $scope.selectedMinDate,
                    //   $scope.selectedMaxDate)
                    yearSelected = initTabLineChart(result, yearSelected, d.type,
                    d.RICid)

                    changeInPercent($scope.entities.sourceEntity.selected.RICid,yValue,
                      yearSelected, d.color, function(tab) {
                    tab.key = d.RICid;
                    linechartData.push(tab)
                    // partnersPct.push(tab);
                    // partnersPct.forEach ( function (d) {
                    //   linechartData.push(d);
                    // });
                    if(linechartData.length===partners.length) $scope.linechartData=linechartData;
                    // $scope.yValue = yValue;
                    // $scope.linechartCurrency = {
                    //   type: {value :"value",writable: true},
                    //   name: {value:"Percent",writable: true}};
                    // $scope.actualCurrency = "percent";
                    // $scope.messagePercent = 1;
                });
              })
            }
          })
          // $scope.yValue = yValue;
          // $scope.linechartCurrency = {
          //   type: {value :"value",writable: true},
          //   name: {value:"Percent",writable: true}
          // };
          // $scope.actualCurrency = "percent";
          // $scope.messagePercent = 1;
        }
    }

    function changeInPercent(reporting_id,yValue,data, color, callback) {
      var percentArrayInit = {};  // object to save pct arrays
        apiService
          .getFlows({
            reporting_ids: reporting_id,
            partner_ids:"Worldsumpartners"
          })
          .then(function (result) {

            // we could don't need this array if api data have good format
            var worldFlowsYears = result.flows;

            // var worldFlowsYearsFormat = [];
            // worldFlowsYears.forEach( function (d) {
            //   worldFlowsYearsFormat.push({
            //     reporting_id: d.reporting_id,
            //     type: null,
            //     partner_id: partner_id,
            //     year: d.year,
            //     imp:d.imp,
            //     exp:d.exp,
            //     total:d.total,
            //     currency: "sterling",
            //     sources: d.sources
            //   });
            // })

            // console.log(worldFlowsYears)
            // worldFlowsYearsFormat = lineChartService.adjustArrayTime(
            //   worldFlowsYearsFormat, $scope.selectedMinDate, $scope.selectedMaxDate)

            // need a new algo to delete two forEach
            var pctArray = [];
            data.forEach( function (data) {
              worldFlowsYears.forEach(function (d) {
                if (data.year == d.year) // == because it's str vs integer
                {
                  pctArray.push({
                    reporting_id: data.reporting_id,
                    type: data.type,
                    partner_id: data.partner_id,
                    year: data.year,
                    imp:getRatio(data,d,"imp"),
                    exp:getRatio(data,d,"exp"),
                    total:getRatio(data,d,"total"),
                    currency: "percent",
                    sources: data.sources
                  });
                }
              })
            })
            percentArrayInit.values = pctArray
            percentArrayInit.color = color;
            percentArrayInit.type = "value";
            percentArrayInit.flowType = yValue;

            callback(percentArrayInit)
          })
    }

    function getRatio(a,b,yValue){
      var ratio ;
      if (a[yValue] === null || a[yValue] === 0
          || b[yValue] === null || b[yValue] === 0)
      {
        ratio = null;
      }
      else {
        ratio = a[yValue] / b[yValue] * 100;
      }
      return ratio;
    }

    /*
     * Api call to take data with sources for dataTable
     */
    //disable takeData function for viewTable model in country.html
    // $scope.takeData = function (){
      // apiService
      //   .getFlows({
      //     reporting_ids: $scope.entities.sourceEntity.selected.RICid,
      //     with_sources:1
      //   })
      //   .then(function (data) {
      //     $scope.tableDataSources = data.flows;
      //   })
    // }

    /*
     * Display and sort table data
     */
    $scope.loading = false;

    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
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

    function setPagingData(data, pageSize, page){
          var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
          $scope.tablePagedData = pagedData;
          $scope.totalServerItems = data.length;
          $scope.loading = false;
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      }

    /*
     * First load data
     */
    //replace all tableDataSources with tableData
    $scope.$watch('tableDataSources', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          setPagingData($scope.tableDataSources, $scope.pagingOptions.pageSize,
            $scope.pagingOptions.currentPage);
        }
    }, true);

    /*
     * Load data when page changed
     */
    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          setPagingData($scope.tableDataSources,$scope.pagingOptions.pageSize,
            $scope.pagingOptions.currentPage);
        }
    }, true);

    /*
     * Watch filter on colomn and changed data
     */
    $scope.$watch('gridOptions.sortInfo', function (newVal, oldVal) {
        if ($scope.tableDataSources) {
          dataTableService.sortData($scope.tableDataSources, newVal.fields[0], newVal.directions[0]);
          setPagingData($scope.tableDataSources,$scope.pagingOptions.pageSize,
            $scope.pagingOptions.currentPage);
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage; // ?

        }
    }, true);



    /*
     * Download functions to have data in csv
     */
    $scope.download = function() {
       apiService
        .getFlows({
          reporting_ids: $scope.entities.sourceEntity.selected.RICid,
          with_sources: 1
        })
        .then(function (result) {
          var headers = TABLE_HEADERS.map(function (h) {
            return h.displayName;
          });

          var order = TABLE_HEADERS.map(function (h) {
            return h.field;
          });

          var fileName = "RICardo - Country - " + $scope.entities.sourceEntity.selected.RICid
          + ' - ' + $scope.selectedMinDate + ' - ' + $scope.selectedMaxDate;

          utils.downloadCSV(result.flows, headers, order, fileName);
      })
    };

    /*
     * Download functions to have data in csv with original currency
     */
    $scope.downloadCurrency = function() {
      apiService
        .getFlows({
          reporting_ids: $scope.entities.sourceEntity.selected.RICid,
          with_sources: 1,
          original_currency: 1})
        .then(function (result) {
          var headers = TABLE_HEADERS.map(function (h) {
            return h.displayName;
          });

          var order = TABLE_HEADERS.map(function (h) {
            return h.field;
          });

          var fileName = "RICardo - Country - " + $scope.entities.sourceEntity.selected.RICid
          + ' - ' + $scope.selectedMinDate + ' - ' + $scope.selectedMaxDate
          + ' - Original currency';

          utils.downloadCSV(result.flows, headers, order, fileName);
      })
    };
  }])