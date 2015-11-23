'use strict';

/* Controllers */

angular.module('ricardo.controllers.country', [])

  .controller('country', function ($scope, $location, $timeout, cfSource, cfTarget, 
    cfSourceLine, apiService, lineChartService, reportingEntities, utils, 
    DEFAULT_REPORTING, TABLE_HEADERS) {
    // message error if no data
    $scope.ok = function () {
      $scope.missing = "0";

    };

    /* all var declarations */
    var data
    $scope.messagePercent = 0;
    $scope.reportingEntities = reportingEntities;  
    // Partners Histo filter
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
      {
        type: {value: "tot",writable: true},
        name: {value: "Average share on Total",writable: true}
      },
      {type: {value: "imp",writable: true},
      name: {value: "Average share on Imports",writable: true}},
      {
        type: {value: "exp",writable: true},
        name: {value: "Average share on Exports",writable: true}
      }];
    $scope.grouped = {};
    $scope.groups = [
      {type: {value: 0,writable: true},name: {value: "None",writable: true}},
      {type: {value: 1,writable: true},name: {value: "Continent",writable: true}
    }];
    $scope.sorted = {};
    $scope.sorts = [
      {type: {value: "name",writable: true},name: {value: "Name",writable: true}},
      {type: {value: "average",writable: true},name: {value: "Average share",writable: true}
    }];

    // line chart filters



    // $scope.lineSterling = {};
    // $scope.lineSterlings = [
    //   {type: {value: "sterling",writable: true},name: {value: "Sterling",writable: true}},
    //   {type: {value: "value",writable: true},name: {value: "Percent",writable: true}
    // }];

    // $scope.lineFlowsType = {};
    // $scope.lineFlowsTypes = [
    //   {type: {value: "sterling",writable: true},name: {value: "Sterling",writable: true}},
    //   {type: {value: "sterling",writable: true},name: {value: "Sterling",writable: true}},
    //   {type: {value: "value",writable: true},name: {value: "Percent",writable: true}
    // }];

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

    $scope.entities = {
      sourceEntity : {}, 
      sourceCountryEntity : {}, 
      sourceColonialEntity : {}, 
      sourceGeoEntity : {}, 
      sourceContinentEntity : {}, 
      sourceWorldEntity : {}
    }

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
    $scope.linechartCurrency.selected = {type: {value :"sterling",writable: true},
    name: {value:"Sterling",writable: true}};
    $scope.linechartFlow.selected = {type: {value :"total",writable: true},
    name: {value:"Total",writable: true}};  
    $scope.conversion = "sterling";


    // First init
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

    // Calling the API to init country selection
    function init(sourceID, currency) {
     
      apiService
        .getFlows({reporting_ids: sourceID, original_currency: currency, with_sources: 1})
        .then(function (result) {
          data = result

          $scope.tableData = data.flows;

          $scope.selectedMinDate = 1600;                   // Min year as selected by selector or brushing
          $scope.selectedMaxDate = 2000;                   // Max year as selected by selector or brushing

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

          // init all entities by types' filters 
          $scope.reportingCountryEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "country"||d.type === "group"})
          $scope.reportingColonialEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "colonial_area"})
          $scope.reportingGeoEntities = $scope.RICentitiesDD.filter(function(d){ 
            return d.type === "geographical_area" && d.RICname.indexOf("World ") !== 0})
          $scope.reportingWorldEntities = $scope.RICentitiesDD.filter(function(d){
            return d.type === "geographical_area" && d.RICname.indexOf("World ") === 0})
          
          // special methods for continent
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

          $scope.reporting = []
          $scope.entities.sourceCountryEntity = {}
          $scope.entities.sourceColonialEntity = {}
          $scope.entities.sourceGeoEntity = {}
          $scope.entities.sourceContinentEntity = {}

          $scope.rawMinDate = d3.min( data.flows, function(d) {return d.year; })
          $scope.rawMaxDate = d3.max( data.flows, function(d) {return d.year; })

          // $scope.selectedMinDate = parseInt(localStorage.getItem('selectedMinDate'));
          // $scope.selectedMaxDate = parseInt(localStorage.getItem('selectedMaxDate'));
        
          // check if dates were in localstorage
          var minDate = parseInt(localStorage.getItem('selectedMinDate'));
          var maxDate = parseInt(localStorage.getItem('selectedMaxDate'));
          $scope.selectedMinDate = minDate ? 
            minDate : Math.max( $scope.selectedMinDate, $scope.rawMinDate );
          $scope.selectedMaxDate = maxDate ? 
            maxDate : Math.min( $scope.selectedMaxDate, $scope.rawMaxDate );

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

          // display filters selection
          $scope.ordered.selected = { type: {value :"tot",writable: true},
          name: {value:"Average share on Total",writable: true}};
          $scope.grouped.selected = { type: {value :0,writable: true},
          name: {value:"None",writable: true}};
          $scope.filtered.selected = { type: {value :"all",writable: true},
          name: {value:"All",writable: true}};
          $scope.sorted.selected = { type: {value :"average",writable: true},
          name: {value:"Average share",writable: true}};
          
          $scope.timelineData=timelineData;  

          // save all object in localStorage
            countryLocalStorageObject.source = sourceID;
            countryLocalStorageObject.data = timelineData;
            countryLocalStorageObject.dateMin = $scope.selectedMinDate
            countryLocalStorageObject.dateMax = $scope.selectedMaxDate
            countryLocalStorageObject.partnerHistoGroup = $scope.grouped.selected
            countryLocalStorageObject.partnerHistoOrder = $scope.grouped.selected
            countryLocalStorageObject.partnerHistoFilter = $scope.filtered.selected
            countryLocalStorage.push(countryLocalStorageObject);

            localStorage.countryLocalStorage = JSON.stringify(countryLocalStorage);    
      });
    }

    // change this function to make only two array, one before and one after date limits
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


    // change comparaison to have !continent
    var initLinechart = function(partners, yValue, conversion){   
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
                yearSelected = initTabLineChart(result, yearSelected, d.type, 
                        d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                $scope.linechartData = [];
                initLineChart2(linechart_flows, yearSelected, 
                  $scope.linechartData, d.RICid, yValue, d.color)

             }); 
            // factorise these lines
            $scope.yValue = yValue;
            $scope.linechartCurrency.selected = {
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
              yearSelected = initTabLineChart(result, yearSelected, d.type, 
                d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                $scope.linechartData = [];
                initLineChart2(linechart_flows, yearSelected, 
                  $scope.linechartData, d.RICid, yValue, d.color)
                
             }); 
            $scope.yValue = yValue;
            $scope.linechartCurrency.selected = {
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
                    yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICid, $scope.selectedMinDate, $scope.selectedMaxDate)

                    changeInPercent($scope.entities.sourceEntity.selected.RICid, yearSelected, yValue, d.color, function(tab) {

                      tab.key = d.RICid;
                      partnersPct.push(tab);
                      $scope.linechartData = [];

                      partnersPct.forEach ( function (d) {
                        $scope.linechartData.push(d);
                      });

                      $scope.yValue = yValue;
                      $scope.linechartCurrency.selected = {type: {value :"value",writable: true},name: {value:"Percent",writable: true}};
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
                    yearSelected = initTabLineChart(result, yearSelected, d.type, d.RICname, $scope.selectedMinDate, $scope.selectedMaxDate)

                changeInPercent($scope.entities.sourceEntity.selected.RICid, yearSelected, yValue, d.color, function(tab) {
                  tab.key = d.RICid;
                  partnersPct.push(tab);
                  $scope.linechartData = [];

                  partnersPct.forEach ( function (d) {
                    $scope.linechartData.push(d);
                  });

                  $scope.yValue = yValue;
                  $scope.linechartCurrency.selected = {type: {value :"value",writable: true},name: {value:"Percent",writable: true}};
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

    function updateDateRange(){

      $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
      $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
      $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )

      updateTableData();
      initLinechart($scope.reporting, $scope.linechartFlow.selected, $scope.linechartCurrency.selected);    }

    function updateTableData(){
      // cfSource.year().filter(
      //   function(d){ 
      //   return new Date($scope.selectedMinDate-1,1,0) <= d && d< new Date($scope.selectedMaxDate + 1,1,0)}
      // );

      // $scope.tableData = cfSource.year().top(Infinity);

      // $scope.tableData = 
      
      var missing;
      var allExpNull = $scope.tableData.every(function (d) {
          return d.exp === null;
        })

      var allImpNull = $scope.tableData.every(function (d) {
          return d.imp === null;
        })

      if (allExpNull && allImpNull) {
        missing = "1"; 
      }
      else {
        missing = "0";  
      }

      var onlyWorld = $scope.tableData.every(function (d) {
        return d.continent === "World";
      })
      if (onlyWorld)
        missing = "1";
      $scope.missing = missing;    
    }

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] != newValue[1]) {
        $scope.selectedMinDate = newValue[0];
        $scope.selectedMaxDate = newValue[1];

        localStorage.removeItem('selectedMinDate');
        localStorage.removeItem('selectedMaxDate');
        localStorage.selectedMinDate = newValue[0];
        localStorage.selectedMaxDate = newValue[1];
        updateDateRange();
        initLinechart($scope.reporting, $scope.linechartFlow.selected, $scope.linechartCurrency.selected);
      }
    })

    /* end initialize */
    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue){
      if(newValue !== oldValue && newValue){

        localStorage.removeItem('sourceEntitySelected');
        localStorage.sourceEntitySelected = JSON.stringify(newValue);
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

    function addReportingToLocalStorage (partners) {
      partners.forEach( function (d) {
        countryLocalStorageObject.partners.push(d)
      })
      countryLocalStorage.push(countryLocalStorageObject);
      localStorage.countryLocalStorage = JSON.stringify(countryLocalStorage);   
    }

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      elm["color"]=$scope.lineColors.pop()
      $scope.reporting.push(elm)
      $scope.resetDD(elm.type)
      addReportingToLocalStorage($scope.reporting);
      initLinechart($scope.reporting, $scope.linechartFlow.selected, $scope.linechartCurrency.selected);
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid) < 0) return;     
      var i = $scope.reporting.map(function (d){return d.RICid}).indexOf(elm.RICid)
      $scope.lineColors.push(elm["color"])
      $scope.reporting.splice(i, 1);

      if ($scope.reporting.length == 0) {
        d3.select("#linechart-world-container > svg").remove();
      }
      initLinechart($scope.reporting, $scope.linechartFlow.selected, $scope.linechartCurrency.selected);
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

    $scope.$watch('reporting', function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        initLinechart($scope.reporting, $scope.linechartFlow.selected.type.value, $scope.linechartCurrency.selected.type.value);
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
          $scope.loading = false;
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