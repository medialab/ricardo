'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  // .controller('matrix', [ "$scope", "$location", "apiService", "dataTableService","utils","flowsByYear","reportingByYear","METADATA_TABLE_HEADERS",
  //   function ($scope, $location, apiService, dataTableService, utils,flowsByYear,reportingByYear,METADATA_TABLE_HEADERS) {
 .controller('matrix', [ "$scope", "$location", "apiService", "dataTableService","utils","METADATA_TABLE_HEADERS",
    function ($scope, $location, apiService, dataTableService, utils,METADATA_TABLE_HEADERS) {
      var yearsDelta = d3.range(1787, 1940)

      $scope.flowChoices = [
        {type: {value: "total",writable: true},
         name: {value: "Total",writable: true}},
        {type: {value: "Exp",writable: true},
         name: {value: "Export",writable: true}},
        {type: {value: "Imp",writable: true},
         name: {value: "Import",writable: true}
      }];

      $scope.chartFlow = $scope.flowChoices[0]

      $scope.partnerChoices = [
        {type: {value: "bilateral",writable: true},
         name: {value: "Bilateral Flows",writable: true}},
        {type: {value: "world",writable: true},
         name: {value: "World Flows",writable: true}
      }];

      $scope.partner = $scope.partnerChoices[0]
      $scope.bilateral= $scope.partner.type.value==="bilateral"

     
      $scope.multichartLayoutChoices = [
            {type: {value: "multiple",writable: true},
             name: {value: "Multiple View",writable: true}},
            {type: {value: "zero",writable: true},
             name: {value: "Stacked View",writable: true}},
            {type: {value: "expand",writable: true},
             name: {value: "Percentage View",writable: true}},
            ];
      $scope.multichartLayout = $scope.multichartLayoutChoices[0]


      function updateLayoutChoices(partner){
        if(partner==="bilateral")
          $scope.matrixLayoutChoices = [
            {type: {value: "years",writable: true},
             name: {value: "Number of Reporting Years",writable: true}},
             {type: {value: "partnerAvg",writable: true},
             name: {value: "Partners in Average",writable: true}},
             {type: {value: "alphabet",writable: true},
             name: {value: "Reporting Name",writable: true}},
            ];
        if(partner==="world")
          $scope.matrixLayoutChoices = [
            {type: {value: "years",writable: true},
             name: {value: "Number of Reporting Years",writable: true}},
             {type: {value: "alphabet",writable: true},
             name: {value: "Reporting Name",writable: true}},
            ];
        
      }
      updateLayoutChoices($scope.partner.type.value)
      $scope.matrixLayout = $scope.matrixLayoutChoices[0]


      function updateColorChoices(partner){
        if(partner==="bilateral")
          $scope.matrixColorChoices = [
            {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
             {type: {value: "partner",writable: true},
             name: {value: "Number of Partners",writable: true}},
             {type: {value: "partner_intersect",writable: true},
             name: {value: "Number of Mirror Partners",writable: true}}
            ];
        if(partner==="world")
          $scope.matrixColorChoices = [
            {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
             {type: {value: "reference",writable: true},
             name: {value: "World Partner",writable: true}}        
            ];
      }
      updateColorChoices($scope.partner.type.value)
      $scope.matrixColorBy=$scope.matrixColorChoices[0]

      // $scope.showBilateralTip=false;

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
          // showFilter: true,
          sortInfo: {
            fields: ["year", "partner"],
            directions: ["asc"]
          }
        }

      $scope.changeFlow = function (flow) {
          $scope.chartFlow=flow;
          // reprocess(reportingByYear,flowsByYear)
          $scope.nbFlows=$scope.numberFlows.filter(function(d){return d.expimp===flow.type.value})
          reprocess($scope.data,$scope.partner.type.value)
      }
      $scope.changePartner = function (partner) {
          $scope.partner=partner;
          updateColorChoices(partner.type.value)
          updateLayoutChoices(partner.type.value)
          var colorByChoices=$scope.matrixColorChoices
                                  .map(function(d){return d.type})
                                  .map(function(d){return d.value})
         
          var layoutChoices=$scope.matrixLayoutChoices
                                  .map(function(d){return d.type})
                                  .map(function(d){return d.value})
          if (colorByChoices.indexOf($scope.matrixColorBy.type.value)===-1) $scope.matrixColorBy=$scope.matrixColorChoices[0]
          if (layoutChoices.indexOf($scope.matrixLayout.type.value)===-1) $scope.matrixLayout=$scope.matrixLayoutChoices[0]
          updatePartner(partner.type.value)  
          $scope.bilateral= $scope.partner.type.value==="bilateral"
      }

      // $scope.changeMultiLayout = function (layout) {
      //   $scope.multichartLayout = layout;
      // }
      // $scope.changeMatrixLayout = function (layout) {
      //   $scope.matrixLayout = layout;
      // }
      // $scope.changeMatrixColor = function (colorBy) {
      //   $scope.matrixColorBy = colorBy;
      // }

      /*
       * Trigger user interaction on colorBy
       */

      // $scope.$watch('matrixColorBy', function (newVal, oldVal) {
      //     if (newVal !== oldVal) {
      //      console.log(newVal)
      //     }
      // }, true);

      //quick nav
      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }

      $scope.loaded=1;

      function updatePartner(partner) {
        apiService.getReportingsAvailableByYear({
                      partner:partner
                    })
                    .then(function (result) {
                      $scope.data=result;
                      reprocess(result,partner)
                    });
        apiService.getNumberFlows({
                      partner:partner
                    })
                    .then(function (result) {
                      $scope.numberFlows=result;
                      $scope.nbFlows=result.filter(function(d){return d.expimp===$scope.chartFlow.type.value})
                    });

      }
      function reprocess(data,partner){
        $scope.rawMinDate = d3.min(data, function(d) { return +d.year; })
        $scope.rawMaxDate = d3.max(data, function(d) { return +d.year; })
        
        var dataFiltered=data.filter(function(d){return d.expimp===$scope.chartFlow.type.value});
        
        //bilateral proc
        if(partner==="bilateral"){
          dataFiltered.forEach(function(d){
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
            d.partner_continent=continents.sort(function(a,b){return b.number-a.number;});
          });

          dataFiltered.forEach(function(d){
            if(d.partners_mirror.length>0 && d.partner.length>0 ){
              // d.partner_mirror=d.partners_mirror.split(",")
              d.partner_intersect = d.partners_mirror.filter(function(value) {
                                     return d.partner.indexOf(value.split("-")[0]) > -1;
                                 });
            }
            else d.partner_intersect=[]
          })
          $scope.flow=dataFiltered
          $scope.flowEntities=d3.nest()
              .key(function(d) { return d.reporting;})
              .entries(dataFiltered);
          $scope.flowEntities.forEach(function(d){
            var partner_sum=d3.sum(d.values,function(d){return d.partner.length})
            d.partnerAvg=d3.round(partner_sum/d.values.length)
            d.years=d.values.length
          })
        }//end proc bilateral

        //bilateral proc
        if(partner==="world"){  
          $scope.flow=dataFiltered

          $scope.flowEntities=d3.nest()
              .key(function(d) { return d.reporting;})
              .entries(dataFiltered);
          $scope.flowEntities.forEach(function(d){
            d.years=d.values.length
          })
        }//end proc bilateral
        
        $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
        $scope.tableData =dataFiltered
        setPagingData($scope.tableData,$scope.pagingOptions.pageSize,
              $scope.pagingOptions.currentPage);
      }//end reprocess

      updatePartner($scope.partner.type.value)
      // function init() {
        // reprocess(reportingByYear,flowsByYear); 
          // d3.json("../metadata.json",function(data){
          //   $scope.data=data;
          //   reprocess(data,flowsByYear);
          // })
          
          // d3.json("../metadata.json", function(reportingByYear) {
          //   d3.json("../nbFlows.json", function(flowsByYear) {
          //    $scope.data=reportingByYear;
          //    $scope.numberFlows=flowsByYear;
          //    reprocess(reportingByYear,flowsByYear); 
          //     $scope.loaded=1;
          //     $scope.$apply(); 
          //   })
          // });
        // }//end init

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