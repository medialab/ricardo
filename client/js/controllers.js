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
    $scope.entities = {sourceEntity : {}, targetEntity : {}}

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
    // scope.entities.sourceEntity.selected=scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
    // scope.entities.targetEntity.selected=scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_PARTNER})[0]

    apiService
      .getFlows({reporting_ids: DEFAULT_REPORTING, partner_ids: DEFAULT_PARTNER})
      .then(function(data){
        console.log('Data loaded', data)
        drawDualTimeline(data.flows)
      })

    function drawDualTimeline(data){
      var margin = {top: 10, right: 0, bottom: 30, left: 0},
          width = document.querySelector('#dual-timeline-container').offsetWidth - margin.left - margin.right,
          height = 180 - margin.top - margin.bottom;

      var x = d3.time.scale()
          .range([0, width]);

      var y = d3.scale.linear()
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("right")
          .ticks(5)
          .tickSize(width)
          .tickFormat(function(d,i){
            var prefix = d3.formatPrefix(d)
            if(i == 0){
              return
            }
            else{
              var symbol;
              if(prefix.symbol == "G"){
                symbol = "billion"
              }else if(prefix.symbol == "M"){
                symbol = "million"
              }else if(prefix.symbol == "k"){
                symbol = "thousand"
              }else{
                symbol = ""
              }
              return prefix.scale(d) + " " + symbol
            }
            
            })

      var areaImp = d3.svg.area()
          .x(function(d) { return x(d.date); })
          .y0(height)
          .y1(function(d) { return y(d.imp); });

      var areaExp = d3.svg.area()
          .x(function(d) { return x(d.date); })
          .y0(height)
          .y1(function(d) { return y(d.exp); });

      var svg = d3.select("#dual-timeline-container").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      data.forEach(function(d){
        d.date = new Date(d.year, 0, 1)
      })

      x.domain(d3.extent( data, function(d) { return d.date; }));
      y.domain([0, d3.max( data, function(d) { return Math.max( d.imp, d.exp ); })]);

      svg.append("path")
          .datum(data)
          .attr("class", "area-imp")
          .attr("d", areaImp)
      
      svg.append("path")
          .datum(data)
          .attr("class", "area-exp")
          .attr("d", areaExp)

      /* axis */

      var gy = svg.select("g.y.axis"),
          gx = svg.select("g.x.axis");

      if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {

        gx = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

        gy = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .call(customAxis);
            
        gy.selectAll("g").filter(function(d) { return d; })
            .classed("minor", true);

      } else {

        gx.transition().duration(duration)
          .call(xAxis)

        gy.transition().duration(duration)
          .call(yAxis)
          .call(customAxis);

        gy.selectAll("g").filter(function(d) { return d; })
            .classed("minor", true);
        
      }

      function customAxis(g) {
        g.selectAll("text")
          .attr("x", 4)
          .attr("dy", -4)
          .attr("font-size", "0.85em");
        }

    }

  })

  .controller('country', function($scope, $location, reportingEntities) {

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