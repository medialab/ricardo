'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "dataTableService","utils","reportingByYear","flowsByYear","METADATA_TABLE_HEADERS",
    function ($scope, $location, apiService, dataTableService, utils,reportingByYear,flowsByYear,METADATA_TABLE_HEADERS) {
 // .controller('matrix', [ "$scope", "$location", "apiService", "dataTableService","utils","flowsByYear","METADATA_TABLE_HEADERS",
 //    function ($scope, $location, apiService, dataTableService, utils,flowsByYear,METADATA_TABLE_HEADERS) {
      var yearsDelta = d3.range(1787, 1940)

      $scope.multichartLayoutChoices = [
            {type: {value: "multiple",writable: true},
             name: {value: "Multiple View",writable: true}},
            {type: {value: "zero",writable: true},
             name: {value: "Stacked View",writable: true}},
            {type: {value: "expand",writable: true},
             name: {value: "Percentage View",writable: true}},
            ];
      $scope.multichartLayout = $scope.multichartLayoutChoices[0]


      $scope.matrixLayoutChoices = [
            {type: {value: "years",writable: true},
             name: {value: "Number of Reporting Years",writable: true}},
             {type: {value: "partnerAvg",writable: true},
             name: {value: "Partners in Average",writable: true}},
             {type: {value: "alphabet",writable: true},
             name: {value: "Reporting Name",writable: true}},
            ];
      $scope.matrixLayout = $scope.matrixLayoutChoices[0]

      $scope.matrixColorChoices = [
             {type: {value: "reference",writable: true},
             name: {value: "World Partner",writable: true}},
             {type: {value: "partner",writable: true},
             name: {value: "Number of Partners",writable: true}},
             {type: {value: "mirror_rate",writable: true},
             name: {value: "Mirror Rate",writable: true}},
             {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
            ];

      $scope.matrixColorBy=$scope.matrixColorChoices[0]
      $scope.colorByIndex=0
      $scope.showBilateralTip=false;

      $scope.synCurveChoices = [
            {type: {value: "none",writable: true},
             name: {value: "None",writable: true}},
             {type: {value: "reference",writable: true},
             name: {value: "World Partner",writable: true}},
             {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
            ];
      $scope.synCurveBy = $scope.synCurveChoices[0]

      $scope.flowChoices = [
      {type: {value: "total",writable: true},
       name: {value: "Total",writable: true}},
      {type: {value: "Exp",writable: true},
       name: {value: "Export",writable: true}},
      {type: {value: "Imp",writable: true},
       name: {value: "Import",writable: true}
      }];

      $scope.chartFlow = $scope.flowChoices[0]

      $scope.grouped=false;

      $scope.$watchCollection('[selectedMinDate, selectedMaxDate]', function (newVal, oldVal) {
              if (newVal !== undefined && newVal !== oldVal && newVal[0] != newVal[1]) {
                $scope.selectedMinDate = newVal[0];
                $scope.selectedMaxDate = newVal[1];

                // update local storage
                localStorage.removeItem('selectedMinDate');
                localStorage.removeItem('selectedMaxDate');
                localStorage.selectedMinDate = newVal[0];
                localStorage.selectedMaxDate = newVal[1];
              }
            })
      $scope.viewTable = 0;

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
          columnDefs: METADATA_TABLE_HEADERS,
          showFilter: true,
          sortInfo: {
            fields: ["year", "partner"],
            directions: ["asc"]
          }
        }

      $scope.changeFlow = function (flow) {
          $scope.chartFlow=flow;
          reprocess(reportingByYear,flowsByYear)
      }

      $scope.changeSynCurve = function (curveBy) {
        $scope.synCurveBy = curveBy;
        // group_reporting($scope.flow,curveBy.type.value)

      }
      // $scope.changeMultiLayout = function (layout) {
      //   $scope.multichartLayout = layout;
      // }
      $scope.changeMatrixLayout = function (layout) {
        $scope.matrixLayout = layout;
      }
      $scope.changeMatrixColor = function (colorBy) {
        $scope.matrixColorBy = colorBy;
        $scope.showBilateralTip= colorBy.type.value==="mirror_rate" ? true:false
        $scope.colorByIndex=$scope.matrixColorChoices.indexOf(colorBy);
      }

      //quick nav
      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }
      function reprocess(data,nbFlows){
        // var worldData=data.filter(function(d){return d.partnertype==="world"})

        // var worldEntities=d3.nest()
        //       .key(function(d) { return d.reporting; })
        //       .key(function(d) { return d.year; })
        //       .entries(worldData);
        // console.log(worldEntities)
        $scope.nbFlows=nbFlows.filter(function(d){return d.expimp===$scope.chartFlow.type.value})
        //data manipulation
        $scope.rawMinDate = d3.min(data, function(d) { return +d.year; })
        $scope.rawMaxDate = d3.max(data, function(d) { return +d.year; })
        var flow=data.filter(function(d){return d.expimp===$scope.chartFlow.type.value});
        var actualData=flow.filter(function(d){return d.partnertype==="actual"})
        var worldData=flow.filter(function(d){return d.partnertype==="world"})
        worldData.forEach(function(d){
          d.partner=[]
        })
        //actualData proc
        actualData.forEach(function(d){
            d.year=+d.year;
            d.partner=[]
            d.partner_continent=[]
            // d.partners.split(",").forEach(function(p){
            if(d.partners===undefined) console.log(d)
            d.partners.forEach(function(p){
              d.partner_continent.push(p.split("+")[1])
              d.partner.push(p.split("+")[0])
            })
            var partner_continent=d3.nest()
                              .key(function(d){return d})
                              .rollup(function(values) { return values.length; })
                              .map(d.partner_continent);

            var continents =[]
            var continent_keys= d3.keys(partner_continent);
            // var imp_keys= d3.keys(imp_continent);
            continent_keys.forEach(function(d){
              // continent.push(exp_keys);
              continents.push({
                "continent":d,
                "number":partner_continent[d]
              })
            })
            d.reference="Actual Reported"
            d.partner_continent=continents.sort(function(a,b){return b.number-a.number;});
          });
          // //worldData proc
          // var worldEntities=d3.nest()
          //       .key(function(d) { return d.reporting; })
          //       .key(function(d) { return d.year; })
          //       .entries(worldData);

          // var worldbestguess=[]
          // worldEntities.forEach(function(d){
          //   d.values.forEach(function(e){
          //     e.worldbestguess=e.values.filter(function(p){return p.partners==="World_best_guess"})[0]
          //     // console.log(e.values.filter(function(p){return p.partners==="World_best_guess"}))
          //     var worldpaterner=e.values.map(function(p){return p.partners})
          //     if(worldpaterner.indexOf("World estimated") > -1) e.worldbestguess.reference= "World estimated"
          //     else if (worldpaterner.indexOf("World as reported") > -1) e.worldbestguess.reference= "World as reported"
          //     else if (worldpaterner.indexOf("World sum partners") > -1) e.worldbestguess.reference= "World sum partners"
          //     else e.worldbestguess.reference="undefined"
          //     e.worldbestguess.partner=[];
          //     worldbestguess.push(e.worldbestguess)
          //   })
          // })

          flow=actualData.concat(worldData)
          var flowEntities=d3.nest()
                .key(function(d) { return d.reporting; })
                .key(function(d) { return d.year; })
                .entries(flow);
          // var flowEntities_uniq=flowEntities
          var flowEntities_uniq=[]
          flowEntities.forEach(function(d){
            d.values.forEach(function(v){
              if(v.values.length>1){
                v.values.forEach(function(e,i){
                  if (e.partnertype==="actual"){
                    var attribute=e
                    // attribute.reference=v.values[1].reference.split("|").length===1 ?  v.values[1].reference : "Multiple world partners"
                    attribute.reference=v.values[1].reference
                    attribute.sourcetype=v.values[1].sourcetype
                    attribute.source=v.values[1].source
                    flowEntities_uniq.push(attribute)
                  }
                })
              }
              else flowEntities_uniq.push(v.values[0])
            })
          })

          flowEntities_uniq.forEach(function(d){
            if(d.partners_mirror.length>0 && d.partner.length>0 ){
              // d.partner_mirror=d.partners_mirror.split(",")
              d.partner_mirror=d.partners_mirror
              d.partner_intersect = d.partner.filter(function(value) {
                                     return d.partner_mirror.indexOf(value) > -1;
                                 });
              // d.mirror_rate=d.partner_intersect.length/d.partner.length
            }
            else {
              d.partner_mirror=[]
              d.partner_intersect=[]
              // d.mirror_rate=0
            }
          })
          var mirror_rateMax=d3.nest()
                               .key(function(d){return d.year})
                               .rollup(function(d){
                                  return d3.max(d,function(g){
                                    return g.partner_intersect.length
                                  })
                                })
                               .map(flowEntities_uniq)
          flowEntities_uniq.forEach(function(d){
            d.mirror_max=mirror_rateMax[d.year];
            if(mirror_rateMax[d.year]>0 && d.partners_mirror.length>0 && d.partner.length>0 ){
              d.mirror_rate=(d.partner_intersect.length/d.partner.length) * (d.partner_intersect.length/d.mirror_max);
            } 
            else d.mirror_rate=0
            
          })
          $scope.flow=flowEntities_uniq
          $scope.flowEntities=d3.nest()
              .key(function(d) { return d.reporting;})
              .entries(flowEntities_uniq);
          $scope.flowEntities.forEach(function(d){
            var partner_sum=d3.sum(d.values,function(d){return d.partner.length})
            d.partnerAvg=d3.round(partner_sum/d.values.length)
            d.years=d.values.length
          })
          $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
          $scope.tableData =flowEntities_uniq
          setPagingData($scope.tableData,$scope.pagingOptions.pageSize,
                $scope.pagingOptions.currentPage);
      }//end reprocess

      function init() {
          // $scope.nbFlows=flowsByYear;
          // $scope.data=reportingByYear;
          reprocess(reportingByYear,flowsByYear);

           // apiService
           //  .getReportingsAvailableByYear()
           //  .then(function (data){
           //    $scope.data=data.slice();
           //    reprocess(data)
           //  })
            // d3.csv("../metadata.csv",function(data){
            //   $scope.data=data;
            //   reprocess(data);
            // })
        }//end init

        init()

        /*
        * Display and sort table data + download csv
        */

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
         * Trigger user interaction on table data
         */

        // $scope.$watch('tableData', function (newVal, oldVal) {
        //     if (newVal !== oldVal) {
        //       setPagingData($scope.tableData,$scope.pagingOptions.pageSize,
        //         $scope.pagingOptions.currentPage);
        //     }
        // }, true);

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
              dataTableService.sortData($scope.tableData, newVal.fields[0], newVal.directions[0])
              setPagingData($scope.tableData,$scope.pagingOptions.pageSize,
                $scope.pagingOptions.currentPage);
              $scope.pagingOptions.currentPage = $scope.pagingOptions.currentPage;
            }
        }, true);

        $scope.download=function(){
          var fileName = "RICardo - Metadata"
          var headers = METADATA_TABLE_HEADERS.map(function(h) {
            return h.displayName;
          });
          var order = METADATA_TABLE_HEADERS.map(function(h) {
              return h.field;
          });
          utils.downloadCSV($scope.tableData, headers, order, fileName);
        }
        // /*
        //  * Trigger user interaction on table data
        //  */
        // $scope.export = function () {
        //   var dataExported = [];
        //     $scope.tableData.forEach(function (d) {
        //         dataExported.push({
        //           reporting_id:d.reporting_id,
        //           reporting:d.reporting,
        //           year:d.year,
        //           expimp:d.expimp,
        //           flow:d.flow,
        //           partners:d.partners,
        //           partnertype:d.partnertype,
        //           source:d.source,
        //           sourcetype:d.sourcetype,
        //           continent:d.continent,
        //           type:d.type,
        //           partners_mirror:d.partners_mirror
        //         })
        //       });

        //       var headers = ["reporting_id","reporting", "year", "expimp", "flow", "partners","partnertype","source","sourcetype","continent","type","partners_mirror"],
        //           order = "",
        //           filename = "metadata";

        //   utils.downloadCSV(dataExported, headers, order, filename);
        // }
 }])