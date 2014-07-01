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
      {slug:"world", label:"World view"},
      {slug:"timeline", label:"Timeline view"}
      //,
      //{slug:"federation", label:"Federation view"},
    ]

  })
  .controller('bilateral', function($scope, $location, reportingEntities) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;
    $scope.entities = {sourceEntity : {}, targetEntity : {}}

    // $scope.sourceEntity.selected = {
    //     "central_state": "France", 
    //     "reporting": "France", 
    //     "type": "Country", 
    //     "continent": "Europe"
    // }

    // $scope.targetEntity.selected = {
    //     "central_state": "United Kingdom", 
    //     "reporting": "United Kingdom", 
    //     "type": "Country", 
    //     "continent": "Europe"
    // }

    //$scope.entities.sourceEntity.selected;

    //$scope.entities.targetEntity.selected;

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
  .controller('country', function($scope, $location, reportingEntities) {

    $scope.palette = ["#f1783c", "#b2e5e3", "#3598c0", "#174858"]
    $scope.reportingEntities = reportingEntities;

    $scope.entities = {sourceEntity : {}}

    // $scope.sourceEntity.selected = {
    //     "central_state": "France", 
    //     "reporting": "France", 
    //     "type": "Country", 
    //     "continent": "Europe"
    // }

    $scope.filter = "all"
    $scope.order = "tot"

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
  .controller('world', function($scope, $location, reportingEntities) {

    $scope.reportingEntities = reportingEntities;
    $scope.entities = {sourceEntity : {}}
    $scope.reporting = []
    $scope.lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']

    $scope.pushReporting = function(elm){
      if($scope.reporting.length >= 5) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) > -1) return;
      $scope.reporting.push(elm) 
    }

    $scope.removeReporting = function(elm){
      if($scope.reporting.length == 1) return;
      if($scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid) < 0) return;
      var i = $scope.reporting.map(function(d){return d.RICid}).indexOf(elm.RICid)
      $scope.reporting.splice(i, 1);
    }

    $scope.$watch('entities.sourceEntity', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          $scope.pushReporting(newVal.selected)
        }
    }, true);

    // $scope.tableData = [];
    // $scope.totalServerItems = 0;
    // $scope.pagingOptions = {
    //     pageSizes: [50],
    //     pageSize: 50,
    //     currentPage: 1
    // }; 

    // $scope.setPagingData = function(data, pageSize, page){
    //     var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
    //     $scope.tablePagedData = pagedData;
    //     $scope.totalServerItems = data.length;
    //     if (!$scope.$$phase) {
    //         $scope.$apply();
    //     }
    // };

    // $scope.tablePagedData = []
    
    // $scope.gridOptions = { 
    //   data: 'tablePagedData',
    //   enablePaging: true,
    //   showFooter: true,
    //   totalServerItems:'totalServerItems',
    //   pagingOptions: $scope.pagingOptions,
    //   enableRowSelection: false,
    //   footerRowHeight: 45,
    //   plugins: [new ngGridCsvExportPlugin({data:'tableData'})]
    // }

    // $scope.$watch('tableData', function (newVal, oldVal) {
    //     if (newVal !== oldVal) {
    //       $scope.pagingOptions.currentPage = 1
    //       $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
    //     }
    // }, true);    

    // $scope.$watch('pagingOptions', function (newVal, oldVal) {
    //     if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
    //       $scope.setPagingData($scope.tableData,$scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
    //     }
    // }, true);


  })
  .controller('timeline', function($scope, $location) {

  })
  .controller('federation', function($scope, $location) {

  })