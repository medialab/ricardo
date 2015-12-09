'use strict';

/* 
 * Bilateral view controller : api call and data manipulation to serve three 
 * visualisations (dualtimeline, brushing & comparison timeline). ******
 */

angular.module('ricardo.controllers.bilateral', [])
  .controller('bilateral', [ "$scope", "$location", "reportingEntities", 
    "cfSource", "cfTarget", "apiService", "dataTableService", "utils", 
    "DEFAULT_REPORTING", "DEFAULT_PARTNER", "TABLE_HEADERS", function ($scope, $location, reportingEntities, 
    cfSource, cfTarget, apiService, dataTableService, utils, 
    DEFAULT_REPORTING, DEFAULT_PARTNER, TABLE_HEADERS) {

    /*
     * Display message if error in selection
     */
     $scope.ok = function () {
      $scope.missing = "0";
    };

    $scope.okTarget = function () {
      $scope.missingTarget = "0";
      
    };

    $scope.fieldsByDefault = function () {
      $scope.missingTarget = "0";
      localStorage.removeItem('selectedMinDate');
      localStorage.removeItem('selectedMaxDate');
      localStorage.removeItem('targetEntitySelected');
      window.location.reload();
    }

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
      };

    /*
     * Var initialisation
     */
    var data
    $scope.reportingEntities = reportingEntities;
    $scope.actualCurrency = "sterling pound"
    $scope.tableData = [];
    $scope.totalServerItems = 0;
    $scope.alerts = []

    /* 
     * Data table init
     */
    $scope.viewTable = 0;
    $scope.pagingOptions = {
        pageSizes: [50],
        pageSize: 50,
        currentPage: 1
    };

    // States
    $scope.timelineData
    $scope.entities = {sourceEntity : {}, targetEntity : {}}
    $scope.rawMinDate                               
    $scope.rawMaxDate                               
    // $scope.selectedMinDate = 1787;                   
    // $scope.selectedMaxDate = 1938;                   
    $scope.rawYearsRange                            
    $scope.rawYearsRange_forInf                     
    $scope.rawYearsRange_forSup                    

    /*
     * First init - check if data are in local storage
     */
    try {
      if (localStorage.sourceEntitySelected && localStorage.targetEntitySelected) 
      {
        $scope.entities.sourceEntity.selected = JSON.parse(localStorage.getItem('sourceEntitySelected'));
        $scope.entities.targetEntity.selected = JSON.parse(localStorage.getItem('targetEntitySelected'));
        init($scope.entities.sourceEntity.selected.RICid, $scope.entities.targetEntity.selected.RICid);
      }
      else if (localStorage.sourceEntitySelected && !localStorage.targetEntitySelected) 
      {
        $scope.entities.sourceEntity.selected = JSON.parse(localStorage.getItem('sourceEntitySelected'));
        apiService
          .getFlows({reporting_ids:$scope.entities.sourceEntity.selected.RICid})
          .then(function (result) {
            for (var i=0, len = result.flows.length; i < len; i++) {
              if (!/^World/.test(result.flows[i].partner_id)) {
                var target = {RICid:"", name:""};
                target.RICid = result.flows[i].partner_id;
                target.RICname = result.flows[i].partner_id;
                $scope.entities.targetEntity.selected = target;
                break;
              }
              i++;
            }
            localStorage.targetEntitySelected = $scope.entities.targetEntity.selected
            $scope.selectedMinDate = JSON.parse(localStorage.getItem('selectedMinDate'))
            $scope.selectedMaxDate = JSON.parse(localStorage.getItem('selectedMaxDate'))
            if ($scope.entities.targetEntity.selected !== undefined)
              init($scope.entities.sourceEntity.selected.RICid, 
                $scope.entities.targetEntity.selected.RICid, 
                $scope.selectedMinDate, $scope.selectedMaxDate);
          })
      }
      else 
      {
        $scope.entities.sourceEntity.selected = $scope.reportingEntities.filter(function(e){
        return e.RICid===DEFAULT_REPORTING})[0]
        $scope.entities.targetEntity.selected = $scope.reportingEntities.filter(function(e){
        return e.RICid===DEFAULT_PARTNER})[0]
        init(DEFAULT_REPORTING, DEFAULT_PARTNER);
      }
    }
    catch (e) {
      console.log("e", e);
      // $scope.entities.sourceEntity.selected = $scope.reportingEntities.filter(function(e){
      //   return e.RICid===DEFAULT_REPORTING})[0]
      // $scope.entities.targetEntity.selected = $scope.reportingEntities.filter(function(e){
      //   return e.RICid===DEFAULT_PARTNER})[0]
      // init(DEFAULT_REPORTING, DEFAULT_PARTNER);
    }

    function init(sourceID, targetID, minDate, maxDate) {
      if (targetID !== undefined) {
        apiService
          .getFlows({reporting_ids: sourceID, partner_ids: targetID, with_sources: 1})
          .then(function (data){
            /* 
             * Set min & max dates
             */
            $scope.rawMinDate = d3.min( data.flows, function(d) { 
              return d.year; 
            })
            $scope.rawMaxDate = d3.max( data.flows, function(d) { 
              return d.year; 
            })

            if (minDate && maxDate)
            {
              $scope.selectedMinDate = minDate;
              $scope.selectedMaxDate = maxDate;

            }
            else
            {
              // $scope.selectedMinDate = Math.max( $scope.selectedMinDate, $scope.rawMinDate )
              $scope.selectedMinDate = $scope.rawMinDate;

              // $scope.selectedMaxDate = Math.min( $scope.selectedMaxDate, $scope.rawMaxDate )
              $scope.selectedMaxDate = $scope.rawMaxDate;

            }

            /* 
             * Consolidate data, add mirror's data to flows array
             */
            mergeMirrorInFlows(data)

            /*
             * Send data to timeline directive
             */
            $scope.timelineData = data.flows;   

            /*
             * Save source & target in localStorage
             */
            localStorage.selectedMinDate = JSON.stringify($scope.selectedMinDate);
            localStorage.selectedMaxDate = JSON.stringify($scope.selectedMaxDate);
            localStorage.sourceEntitySelected = JSON.stringify($scope.entities.sourceEntity.selected);
            localStorage.targetEntitySelected = JSON.stringify($scope.entities.targetEntity.selected);
          
            // call function to send data to tableData
            updateDateRange(data)

          },function (res){
            if (res[1] === 500)
            {
              $scope.missingTarget = "1";
              if ($scope.entities.sourceEntity.selected.RICid == $scope.entities.targetEntity.selected.RICid) {
                $scope.message = "Same source and target " + $scope.entities.targetEntity.selected.RICname
              }
              else {
                $scope.message = "Missing Target " + $scope.entities.targetEntity.selected.RICname
              }
            }
          }
        )
      }
    }
     
    /*
     * Watch if entities and dates change
     */

    $scope.$watch("entities.sourceEntity.selected", function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        // set data in local storage
        localStorage.removeItem('sourceEntitySelected');
        localStorage.sourceEntitySelected = JSON.stringify(newValue);
        init(newValue.RICid, $scope.entities.targetEntity.selected.RICid, $scope.selectedMinDate, $scope.selectedMaxDate);
      }
    })

    $scope.$watch("entities.targetEntity.selected", function (newValue, oldValue){
      if(newValue !== oldValue && newValue){
        // set data in local storage
        localStorage.removeItem('targetEntitySelected');
        localStorage.targetEntitySelected = JSON.stringify(newValue);
        init($scope.entities.sourceEntity.selected.RICid, newValue.RICid, $scope.selectedMinDate, $scope.selectedMaxDate);
      }
    })

    $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newValue, oldValue) {
      if (newValue !== oldValue && newValue[0] !== newValue[1]) {
        // set data in local storage
        localStorage.removeItem('selectedMinDate');
        localStorage.removeItem('selectedMaxDate');
        localStorage.selectedMinDate = newValue[0];
        localStorage.selectedMaxDate = newValue[1];
        updateDateRange()
      }
    })

    /* 
     * Update Range from date on flows array 
     */
    function updateDateRange(data){
        $scope.rawYearsRange = d3.range( $scope.rawMinDate, $scope.rawMaxDate + 1 )
        $scope.rawYearsRange_forInf = d3.range( $scope.rawMinDate, $scope.selectedMaxDate )
        $scope.rawYearsRange_forSup = d3.range( $scope.selectedMinDate + 1, $scope.rawMaxDate + 1 )
      if (data !== undefined) {
        cfSource.clear()
        cfSource.add(data.flows.filter(function(d){
          return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
        }));

        cfTarget.clear()
        cfTarget.add(data.mirror_flows.filter(function(d){
          return d.year >= $scope.selectedMinDate && d.year <= $scope.selectedMaxDate;
        }));

        $scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity));
    
        // Select data to check if there are and if not, display message no data
        var dataFilterBySource = d3.nest()
          .key(function (d) {return d.reporting_id})
          .entries($scope.tableData);

        if (dataFilterBySource[0] !== undefined) {
          var missing;
          var allExpNull = dataFilterBySource[0].values.every(function (d) {
            return d.exp === null ;})
          var allImpNull = dataFilterBySource[0].values.every(function (d) {
            return d.imp === null ;})

          if (allExpNull && allImpNull) {
            missing = "1"; 
          }
          else {
            missing = "0";  
          }
          $scope.missing = missing;  
        }
      }
    }

    /* 
     * Merge mirror array in flows array 
     */
    function mergeMirrorInFlows(data){
      // exchange between countries by year
      var mirrorFlows_byYear = {}  

      /*
       * First step : clean mirror_flows and push data into mirrorFlos_byYear
       */
      data.mirror_flows.forEach(function(d){
        var obj = mirrorFlows_byYear[d.year] || {}
        obj.imp = d.imp || null
        obj.exp = d.exp || null
        mirrorFlows_byYear[d.year] = obj // useless ?
      })

      /* 
       * Second step : add mirror_flow to flow
       */

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

    /*
     * Datatable initalisation & functions
     */

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

    function setPagingData(data, pageSize, page){
          var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
          $scope.tablePagedData = pagedData;
          $scope.totalServerItems = data.length;
          $scope.loading = false;
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      }

    $scope.$watch('tableData', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          setPagingData($scope.tableData, $scope.pagingOptions.pageSize, 
            $scope.pagingOptions.currentPage);
        }
    }, true);

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
          setPagingData($scope.tableData,$scope.pagingOptions.pageSize, 
            $scope.pagingOptions.currentPage);
        }
    }, true);

    /* 
     * Watch filter on colomn and changed data 
     */
    $scope.$watch('gridOptions.sortInfo', function (newVal, oldVal) {
        if ($scope.tableData) {
          $scope.loading = true;
          dataTableService.sortData($scope.tableData, newVal.fields[0], newVal.directions[0]);
          setPagingData($scope.tableData,$scope.pagingOptions.pageSize, 
            $scope.pagingOptions.currentPage); 
          $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
        }
    }, true);

    /*
     * Download data selected
     */

    $scope.download = function() {
      var fileName = "RICardo - Bilateral - " + $scope.entities.sourceEntity.selected.RICid 
      + ' - ' + $scope.entities.targetEntity.selected.RICid + ' - ' + $scope.selectedMinDate
      + ' - ' + $scope.selectedMaxDate;
      var headers = TABLE_HEADERS.map(function(h) {
        return h.displayName;
      });

      var order = TABLE_HEADERS.map(function(h) {
        return h.field;
      });

      var data = $scope.tableData;
      utils.downloadCSV(data, headers, order, fileName);
    };   
  }])