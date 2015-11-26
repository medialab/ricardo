'use strict';

/* Controllers */

angular.module('ricardo.controllers.country', [])

  .controller('country', function ($scope, $location, $timeout, cfSource, cfTarget, 
    cfSourceLine, apiService, lineChartService, reportingEntities, utils, 
    DEFAULT_REPORTING, TABLE_HEADERS) {
    /* 
     * message error if no data
     */
    $scope.ok = function () {
      $scope.missing = "0";
    };  

    /* 
     * Partners Histo filter
     */
    $scope.filtered = {};
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
       name: {value: "Average share on Exports",writable: true}
      }];

    $scope.grouped = {};
    $scope.groups = [
      {type: {value: 0,writable: true},
       name: {value: "None",writable: true}},
      {type: {value: 1,writable: true},
       name: {value: "Continent",writable: true}
    }];

    $scope.sorted = {};
    $scope.sorts = [
      {type: {value: "name",writable: true},
       name: {value: "Name",writable: true}},
      {type: {value: "average",writable: true},
       name: {value: "Average share",writable: true}
    }];

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
    $scope.messagePercent = 0;
    $scope.reportingEntities = reportingEntities;

    $scope.entities = {
      sourceEntity : {}, 
      sourceCountryEntity : {}, 
      sourceColonialEntity : {}, 
      sourceGeoEntity : {}, 
      sourceContinentEntity : {}, 
      sourceWorldEntity : {}
    }

    $scope.RICentities = {}
    $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
        if(a.RICname < b.RICname) return -1;
        if(a.RICname > b.RICname) return 1;
        return 0;
    })

    /*
     * Arrays of entities for linechart
     */

    $scope.reporting = []
    $scope.reportingCountryEntities = [];
    $scope.reportingColonialEntities = [];
    $scope.reportingGeoEntities = [];
    $scope.reportingContinentEntities = [];
    $scope.reportingWorldEntities = [];

    /*
     * Linecharts default config
     */

    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']
    $scope.linechartCurrency = {type: {value :"sterling",writable: true},
                                name: {value:"Sterling",writable: true}};
    $scope.linechartFlow = {type: {value :"total",writable: true},
                            name: {value:"Total",writable: true}};  

    $scope.missingData = [];
    $scope.viewTable = 0;

    $scope.yValue = "total";
    $scope.conversion = "sterling";
    $scope.filter = "all"
    $scope.order = "tot"
    $scope.currency = 0
    $scope.actualCurrency = "sterling pound"


    /* 
     * First init
     */
     if (localStorage.sourceEntitySelected) {
      try {
        var sourceEntityLocalStorage = localStorage.getItem('sourceEntitySelected');
        $scope.entities.sourceEntity.selected = JSON.parse(sourceEntityLocalStorage);
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

     var countryLocalStorage = [],
        countryLocalStorageObject = {
          source : "", 
          data: [], 
          dateMin: "", 
          dateMax: "", 
          partnerHistoGroup:{}, 
          partnerHistoOrder: {}, 
          partnerHistoFilter: {}, 
          partners: []
        }

    if (localStorage.countryLocalStorage) 
      countryLocalStorage = JSON.parse(localStorage.countryLocalStorage);

    /* 
     * Calling the API to init country selection
     */
    function init(sourceID, currency) {
      apiService
        .getFlows({reporting_ids: sourceID, original_currency: currency, with_sources: 1})
        .then(function (result) {
          data = result
          $scope.tableData = data.flows;
          $scope.selectedMinDate = 1600;                   
          $scope.selectedMaxDate = 2000;                   

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

          $scope.RICentitiesDD = d3.values($scope.RICentities).sort(function(a,b){
              if(a.RICname < b.RICname) return -1;
              if(a.RICname > b.RICname) return 1;
              return 0;
          })

          /*
           *  Init all entities by types filters for linechart viz
           */

          $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "country" || d.type === "group"})
          $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "colonial_area"})
          $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function(d){ 
            return d.type === "geographical_area" && d.RICname.indexOf("World ") !== 0})
          $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "geographical_area" && d.RICname.indexOf("World ") === 0})
          
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
          var minDate = parseInt(localStorage.getItem('selectedMinDate'));
          var maxDate = parseInt(localStorage.getItem('selectedMaxDate'));
          $scope.selectedMinDate = minDate ? 
            minDate : Math.max( $scope.selectedMinDate, $scope.rawMinDate );
          $scope.selectedMaxDate = maxDate ? 
            maxDate : Math.min( $scope.selectedMaxDate, $scope.rawMaxDate );


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

          /* 
           * Display filters selection and init partner histogram
           */
          $scope.ordered = {type: {value :"tot",writable: true},
                            name: {value:"Average share on Total",writable: true}};
          $scope.grouped = {type: {value :0,writable: true},
                            name: {value:"None",writable: true}};
          $scope.filtered = {type: {value :"all",writable: true},
                            name: {value:"All",writable: true}};
          $scope.sorted = { type: {value :"average",writable: true},
                            name: {value:"Average share",writable: true}};

          initPartnerHisto($scope.tableData)
          

          /* 
           * Save all object in localStorage
           */
          countryLocalStorageObject.source = sourceID;
          countryLocalStorageObject.data = timelineData;
          countryLocalStorageObject.dateMin = $scope.selectedMinDate
          countryLocalStorageObject.dateMax = $scope.selectedMaxDate
          countryLocalStorage.push(countryLocalStorageObject);

          localStorage.countryLocalStorage = JSON.stringify(countryLocalStorage);    
      });
    }

    /*
     * Triggers entity selected and dates
     */

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] != newValue[1]) {
        $scope.selectedMinDate = newValue[0];
        $scope.selectedMaxDate = newValue[1];

        localStorage.removeItem('selectedMinDate');
        localStorage.removeItem('selectedMaxDate');
        localStorage.selectedMinDate = newValue[0];
        localStorage.selectedMaxDate = newValue[1];
        updateDateRange();
        initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      }
    })

    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
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
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);    }

    function updateTableData(){
      // cfSource.year().filter(
      //   function(d){ 
      //   return new Date($scope.selectedMinDate-1,1,0) <= d && d< new Date($scope.selectedMaxDate + 1,1,0)}
      // );

      // $scope.tableData = cfSource.year().top(Infinity);

      // $scope.tableData = 
      
      var missing;
      var allExpNull = $scope.tableData.every(function (d) { return d.exp === null;})

      var allImpNull = $scope.tableData.every(function (d) { return d.imp === null;})

      if (allExpNull && allImpNull) {
        missing = "1"; 
      }
      else {
        missing = "0";  
      }

      var onlyWorld = $scope.tableData.every(function (d) { return d.continent === "World"; })

      if (onlyWorld)
        missing = "1";
      $scope.missing = missing;    
    }


    /* 
     * Comment these lines to use filter in linechart directive 
     */

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



    function addReportingToLocalStorage(partners) {
      partners.forEach( function (d) {
        countryLocalStorageObject.partners.push(d)
      })
      countryLocalStorage.push(countryLocalStorageObject);
      localStorage.countryLocalStorage = JSON.stringify(countryLocalStorage);   
    }

    /* 
     * Push item in array to display line chart 
     */

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      if ($scope.reporting.length >= 1)
      {
        console.log("reporting")
        $('.collapse').collapse()
      }
      $scope.resetDD(elm.type)
      addReportingToLocalStorage($scope.reporting);
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
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
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
    }

    $scope.resetDD = function(t){ 
      console.log("t", t);
      if(t === "country"){$scope.entities.sourceCountryEntity = undefined}
      if(t === "colonial_area"){$scope.entities.sourceColonialEntity = undefined}
      if(t === "geographical_area"){
        $scope.entities.sourceGeoEntity = undefined
        $scope.entities.sourceWorldEntity = undefined
      }
      if(t === "continent"){$scope.entities.sourceContinentEntity = undefined}
    }

    /*
     * Partners Histo tools functions
     */

    function rollupYears(leaves){
          var res = {
            exp: d3.sum(leaves, function(d){
              if (!/^World/.test(d.partner_id) )
                return d.exp
              else
                return 0
            }),
            imp: d3.sum(leaves, function(d){
              if (!/^World/.test(d.partner_id) )
                return d.imp
              else
                return 0
            }),
          };
          res.tot = res.exp + res.imp;
          res.type = leaves
          return res;
    }

    /* 
     * Add type to partner
     */

    function addTypePartner(partners, data) {
      var entityChecked = []; 
      partners.forEach(function (d) {
        if (entityChecked.indexOf(d.key) === -1 ) {
          for (var i = 0, len = data.length; i < len; i++) {
            if (d.key === data[i].partner_id) {
              d.type = data[i].type
              entityChecked.push(d.key);
            }
          }  
        }
      })
      return partners;
    }

    /*
     * Add value for visualisation
     */

    function valuesToPartners(partners, indexYears) {
      partners.forEach(function(p){
        p.years = []
        p.values.forEach(function(d){
          p.years.push({
            key: d.key,
            exp: d.values.exp,
            imp: d.values.imp,
            balance: (d.values.exp - d.values.imp) / (d.values.exp + d.values.imp) || 0,
            pct_exp: d.values.exp / indexYears[d.key].exp * 100,
            pct_imp: d.values.imp / indexYears[d.key].imp * 100,
            pct_tot: (d.values.exp + d.values.imp) / indexYears[d.key].tot * 100
          });
        });

        delete p.values;
        p.avg_tot = d3.mean(p.years, function(d){ return d.pct_tot });
        p.avg_imp = d3.mean(p.years, function(d){ return d.pct_imp });
        p.avg_exp = d3.mean(p.years, function(d){ return d.pct_exp });
      })
      return partners  
    }

    function buildIndexYears(data) {
      var indexYears = {};

      d3.nest()
        .key(function(d){ return d.year })
        .rollup(rollupYears)
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
      var data = $scope.tableData;
      var indexYears = buildIndexYears(data);
      $scope.indexYears = indexYears;


      data=data.filter(function(p){ return !/^World/.test(p.partner_id)})
      
      var partners = d3.nest()  
        .key(function(d){ return d[$scope.grouped.type.value ? "continent" : "partner_id"] })
        .key(function(d){ return d.year })
        .rollup(rollupYears)
        .entries(data)

      partners = addTypePartner(partners, data);
      partners = valuesToPartners(partners, indexYears);


      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) { return d.type === $scope.filtered.type.value})

      partners = partners.sort(function(a,b){
        if ($scope.sorted === 'name') 
          return d3.ascending(a.key, b.key);
        else {
          return d3.descending(a["avg_" + $scope.ordered], b["avg_" + $scope.ordered]);
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
        .key(function(d){ return d[group.type.value ? "continent" : "partner_id"] })
        .key(function(d){ return d.year })
        .rollup(rollupYears)
        .entries(data)

      partners = addTypePartner(partners, data);
      partners = valuesToPartners(partners, indexYears);


      if ($scope.filtered.type.value !== "all")
        partners = partners.filter(function (d) { return d.type === $scope.filtered.type.value})

      partners = partners.sort(function(a,b){
        if ($scope.sorted.type.value === 'name') 
          return d3.ascending(a.key, b.key);
        else {
          return d3.descending(a["avg_" + $scope.ordered.type.value], b["avg_" + $scope.ordered.type.value]);
        }
      });

      $scope.partnersData = partners
    }

    $scope.changeSort = function (sort) {
        $scope.sorted = sort;

        var data = $scope.tableData;
        var indexYears = buildIndexYears(data);
        $scope.indexYears = indexYears;

        data=data.filter(function(p){ return !/^World/.test(p.partner_id)})
        
        var partners = d3.nest()  
          .key(function(d){ return d[$scope.grouped.type.value ? "continent" : "partner_id"] })
          .key(function(d){ return d.year })
          .rollup(rollupYears)
          .entries(data)

        partners = addTypePartner(partners, data);
        partners = valuesToPartners(partners, indexYears);


        if ($scope.filtered.type.value !== "all")
          partners = partners.filter(function (d) { return d.type === $scope.filtered.type.value})

        partners = partners.sort(function(a,b){
          if (sort.type.value === 'name') 
            return d3.ascending(a.key, b.key);
          else {
            return d3.descending(a["avg_" + $scope.ordered.type.value], b["avg_" + $scope.ordered.type.value]);
          }
        });

        $scope.partnersData = partners
    }

    $scope.changeOrder = function (order) {
        $scope.ordered = order;

        var data = $scope.tableData;
        var indexYears = buildIndexYears(data);
        $scope.indexYears = indexYears;


        data=data.filter(function(p){ return !/^World/.test(p.partner_id)})
        
        var partners = d3.nest()  
          .key(function(d){ return d[$scope.grouped.type.value ? "continent" : "partner_id"] })
          .key(function(d){ return d.year })
          .rollup(rollupYears)
          .entries(data)

        partners = addTypePartner(partners, data);
        partners = valuesToPartners(partners, indexYears);


        if ($scope.filtered.type.value !== "all")
          partners = partners.filter(function (d) { return d.type === $scope.filtered.type.value})

        partners = partners.sort(function(a,b){
          if ($scope.sorted.type.value === 'name') 
            return d3.ascending(a.key, b.key);
          else {
            return d3.descending(a["avg_" + order.type.value], b["avg_" + order.type.value]);
          }
        });

        $scope.partnersData = partners
    }

    $scope.changeFilter = function (filter) {
        $scope.filtered = filter;

        var data = $scope.tableData;
        var indexYears = buildIndexYears(data);
        $scope.indexYears = indexYears;

        data=data.filter(function(p){ return !/^World/.test(p.partner_id)})
        
        var partners = d3.nest()  
          .key(function(d){ return d[$scope.grouped.type.value ? "continent" : "partner_id"] })
          .key(function(d){ return d.year })
          .rollup(rollupYears)
          .entries(data)

        partners = addTypePartner(partners, data);
        partners = valuesToPartners(partners, indexYears);

        if (filter.type.value !== "all")
          partners = partners.filter(function (d) { return d.type === filter.type.value})

        partners = partners.sort(function(a,b){
          if ($scope.sorted.type.value === 'name') 
            return d3.ascending(a.key, b.key);
          else {
            return d3.descending(a["avg_" + $scope.ordered.type.value], b["avg_" + $scope.ordered.type.value]);
          }
        });

        $scope.partnersData = partners
    }

    /*
     *  Linechart triggers
     */

    $scope.$watch('reporting', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        initLinechart($scope.reporting, $scope.linechartFlow.type.value, $scope.linechartCurrency.type.value);
      }
    }, true)


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
      initLinechart($scope.reporting, $scope.linechartFlow.type.value, currency.type.value);
      $scope.linechartCurrency = currency;
    }

    $scope.changeFlow = function (flow) {
      initLinechart($scope.reporting, flow.type.value, $scope.linechartCurrency.type.value);
      $scope.linechartFlow = flow;
    }

    /*
     * linechart functions
     */

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

    function initLinechart(partners, yValue, conversion){   
        var linechart_flows=[]
        if(partners.length>0 && conversion === "sterling" )
        {
          partners.forEach( function (d) {
          if (d.type !== "continent") {
            apiService
              .getFlows({
                reporting_ids: $scope.entities.sourceEntity.selected.RICid, 
                partner_ids: d.RICid, 
                with_sources: 1})
              .then(function (result) {
                var yearSelected = [];
                yearSelected = lineChartService.initTabLineChart(result, yearSelected, d.type, 
                        d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                $scope.linechartData = [];
                initLineChart2(linechart_flows, yearSelected, 
                  $scope.linechartData, d.RICid, yValue, d.color)

             }); 
            // factorise these lines
            $scope.yValue = yValue;
            $scope.linechartCurrency= {
              type: {value :"sterling",writable: true},
              name: {value:"Sterling",writable: true}};
            $scope.messagePercent = 0;
          }
          else {
             apiService
              .getContinentFlows({
                continents: d.RICid , 
                reporting_ids: $scope.entities.sourceEntity.selected.RICid, 
                with_sources: 1})
              .then(function (result) {
               var yearSelected = [];
              yearSelected = lineChartService.initTabLineChart(result, yearSelected, d.type, 
                d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                $scope.linechartData = [];
                initLineChart2(linechart_flows, yearSelected, 
                  $scope.linechartData, d.RICid, yValue, d.color)
                
             }); 
            $scope.yValue = yValue;
            $scope.linechartCurrency = {
              type: {value :"sterling",writable: true},
            name: {value:"Sterling",writable: true}};
            $scope.messagePercent = 0;
          }
        })


        //   var reportingID = $scope.entities.sourceEntity.selected.RICid;

        //   // array of partner id
        //   var partner_ids = partners.filter(function (partner){return partner.type!=="continent"}).map(function (partner){return partner.RICid});

        //   cfSource.partner().filterFunction( function (partner){ return partner_ids.indexOf(partner)!==-1} );

        //   // save all partners for years available
        //   linechart_flows=cfSource.year().top(Infinity)
        //   linechart_flows.sort(function(a, b){ return d3.ascending(a.year, b.year); })
          
        //   console.log("linechart_flows £", linechart_flows);
        //   linechart_flows = lineChartService.adjustArrayTime(linechart_flows, $scope.selectedMinDate, $scope.selectedMaxDate)

        //   console.log("linechart_flows £", linechart_flows);

        //   cfSource.partner().filterAll()  

        //   var continents = partners.filter(function (partner){return partner.type==="continent"});
        //   continents.forEach(function (continent)
        //   { 
        //     cfSource.continent().filterFunction( function(d){ return d===continent.RICid} );
            
        //     var flows=cfSource.years().top(Infinity)
        //     flows.sort(function(a, b){ return d3.ascending(a.key, b.key); })
        //     flows.forEach(function(d){
        //             var year = (new Date(d.key)).getFullYear()
        //             if( year>=$scope.selectedMinDate && year<=$scope.selectedMaxDate)
        //             {
        //               var td = $.extend({},d.value, {year: year,partner_id:continent.RICid});
        //               if (!td.exp)
        //                 td.exp = null;
        //               if (!td.imp)
        //                 td.imp = null;
        //               if (!td.tot)
        //                 td.tot = null;
        //               td.total=td.tot
        //               delete(td.tot)

        //               linechart_flows.push(td);
        //             }
        //          });
        //      cfSource.continent().filterAll()
        //   });            
        // // array of partners (obj)
        // $scope.linechartData = d3.nest()
        //   .key(function (d){return d.partner_id})
        //   .entries(linechart_flows)

        // $scope.linechartData.flowType = yValue;      
        }
        
        var partnersPct = [];
        if (partners.length>0  && conversion === "value")
        {
          partners.forEach( function (d) {
            if (d.type !== "continent") {
              // var partner = cfSource.partner().filterFunction( function (partner){ return partner===d.RICid});             
              // linechart_flows = cfSource.year().top(Infinity)
              // var flowsCopy = lineChartService.adjustArrayTime(linechart_flows, $scope.selectedMinDate, $scope.selectedMaxDate)

              apiService
                  .getFlows({reporting_ids: $scope.entities.sourceEntity.selected.RICid, partner_ids:d.RICid, with_sources:1})
                  .then(function (result) {
                    var yearSelected = [];
                    yearSelected = lineChartService.initTabLineChart(result, yearSelected, d.type, d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                    changeInPercent($scope.entities.sourceEntity.selected.RICid, yearSelected, yValue, d.color, function(tab) {

                      tab.key = d.RICid;
                      partnersPct.push(tab);
                      $scope.linechartData = [];

                      partnersPct.forEach ( function (d) {
                        $scope.linechartData.push(d);
                      });

                      $scope.yValue = yValue;
                      $scope.linechartCurrency = {type: {value :"value",writable: true},name: {value:"Percent",writable: true}};
                      $scope.actualCurrency = "percent";
                      $scope.messagePercent = 1;
                    });
                  })
            }
            else {
              // var continent = cfSource.continent().filterFunction( function (continent){ return continent===d.RICid});             
              // linechart_flows = cfSource.year().top(Infinity)
              apiService
                  .getContinentFlows({continents: d.RICid, reporting_ids:$scope.entities.sourceEntity.selected.RICid, with_sources:1})
                  .then(function (result) {
                   var yearSelected = [];
                    yearSelected = lineChartService.initTabLineChart(result, yearSelected, d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                changeInPercent($scope.entities.sourceEntity.selected.RICid, yearSelected, yValue, d.color, function(tab) {
                  tab.key = d.RICid;
                  partnersPct.push(tab);
                  $scope.linechartData = [];

                  partnersPct.forEach ( function (d) {
                    $scope.linechartData.push(d);
                  });

                  $scope.yValue = yValue;
                  $scope.linechartCurrency = {type: {value :"value",writable: true},name: {value:"Percent",writable: true}};
                  $scope.actualCurrency = "percent";
                  $scope.messagePercent = 1;
                });
              })
            }
          })
        }
              // cfSource.partner().filterAll();
    }

    function changeInPercent(partner_ids, data, yValue, color, callback) {
      var percentArrayInit = {};  // object to save pct arrays        
        apiService
          .getFlows({reporting_ids: partner_ids, partner_ids:"Worldsumpartners", with_sources:1})
          .then(function (result) {

            // we could don't need this array if api data have good format
            var worldFlowsYears = result.flows;

            var worldFlowsYearsFormat = [];
            worldFlowsYears.forEach( function (d) {
              worldFlowsYearsFormat.push({
                reporting_id: d.reporting_id,
                type: null,
                partner_id: d.partner_id, 
                year: d.year, 
                imp:d.imp,
                exp:d.exp, 
                total:d.total, 
                currency: "sterling",
                sources: d.sources
              }); 
            })

            
            worldFlowsYearsFormat = lineChartService.adjustArrayTime(worldFlowsYearsFormat, $scope.selectedMinDate, $scope.selectedMaxDate)

            // need a new algo to delete two forEach 
            var pctArray = [];
            data.forEach( function (data) {
              worldFlowsYearsFormat.forEach(function (d) {
                if (data.year == d.year) // == because it's str vs integer
                {
                  var ratio ;
                  if (data[yValue] === null || data[yValue] === 0 || d[yValue] === null || d[yValue] === 0)
                  {
                    ratio = null;
                  }
                  else {
                    ratio = data[yValue] / d[yValue] * 100;
                  }
                  pctArray.push({reporting_id: data.reporting_id, year: data.year, value:ratio});
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

    /*
     * Sort data in display array
     */
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
      columnDefs: TABLE_HEADERS,
      showFilter: true,
      sortInfo: {
        fields: ["year", "partner"],
        directions: ["asc"]
      }
    }

    /* 
     * First load data 
     */ 
    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    /* 
     * Load data when page changed 
     */
    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }
    }, true);

    /* 
     * Watch filter on colomn and changed data 
     */
    $scope.$watch('gridOptions.sortInfo', function (newVal, oldVal) {
        if ($scope.tableData) {
          $scope.loading = true;
          sortData($scope.tableData, newVal.fields[0], newVal.directions[0]);
          $scope.loading = false;
          $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage); 
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
          
        }
    }, true);

    /*
     * Download functions to have data in csv
     */
    $scope.download = function() {
      var headers = TABLE_HEADERS.map(function (h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function (h) {
        return h.field;
      });

      utils.downloadCSV($scope.tableData, headers, order);
    };

    $scope.downloadCurrency = function() {
      apiService
        .getFlows({reporting_ids: $scope.entities.sourceEntity.selected.RICid, with_sources: 1, original_currency: 1})
        .then(function (result) {
          var headers = TABLE_HEADERS.map(function (h) {
            return h.displayName;
          });

          var order = TABLE_HEADERS.map(function (h) {
            return h.field;
          });

          utils.downloadCSV(result.flows, headers, order);
      })
    };
  })