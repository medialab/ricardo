'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

      var yearsDelta = d3.range(1787, 1940)

      $scope.sorted = {};
      $scope.sort = [
      {type: {value: "name",writable: true},
       name: {value: "name",writable: true}
       },
      {type: {value: "coverage",writable: true},
       name: {value: "coverage",writable: true}
      }]

      $scope.stackflowChoices = [
      {type: {value: "total_flow",writable: true},
       name: {value: "Total",writable: true}},
      {type: {value: "exp_flow",writable: true},
       name: {value: "Exports",writable: true}},
      {type: {value: "imp_flow",writable: true},
       name: {value: "Imports",writable: true}
      }];

      $scope.stackchartFlow = $scope.stackflowChoices[0]

      $scope.matrixflowChoices = [
        {type: {value: "total_flow",writable: true},
         name: {value: "Total",writable: true}},
        {type: {value: "exp_flow",writable: true},
         name: {value: "Exports",writable: true}},
        {type: {value: "imp_flow",writable: true},
         name: {value: "Imports",writable: true}},
        {type: {value: "total_partner",writable: true},
         name: {value: "All Partners",writable: true}},
        {type: {value: "exp_partner",writable: true},
         name: {value: "Export Partners",writable: true}},
        {type: {value: "imp_partner",writable: true},
         name: {value: "Import Partners",writable: true}
      }];

      $scope.matrixFlow = $scope.matrixflowChoices[0]


      $scope.stackchartLayoutChoices = [
        {type: {value: "zero",writable: true},
         name: {value: "Stacked",writable: true}},
        {type: {value: "expand",writable: true},
         name: {value: "Percent",writable: true}},
        {type: {value: "multiple",writable: true},
         name: {value: "Multiple",writable: true}}
        ];
      $scope.stackchartLayout = $scope.stackchartLayoutChoices[2]

      $scope.matrixLayoutChoices = [
        {type: {value: "coverage",writable: true},
         name: {value: "Coverage",writable: true}},
        {type: {value: "alphabet",writable: true},
         name: {value: "Alphabet",writable: true}}
        ];
      $scope.matrixLayout = $scope.matrixLayoutChoices[0]

    	var continentColors2 = [
    			{"name" :"Europe",
    			"color": "#DADB63"},
    			{"name" :"Asia",
    			"color": "#E3B1D2" },
    			{"name" :"Africa",
    			"color": "#77E0B6"},
    			{"name" :"America",
    			"color": "#96D2DF"},
    			{"name" :"World",
    			"color": "#E3B171"},
    			{"name" :"Oceania",
    			"color": "#AEDF8A"}
    			]

  	  $scope.continentsColors = continentColors2;

        function init() {
          apiService
            .getReportingsAvailableByYear()
            .then(function (data){
              //data manipulation
              $scope.data=data;
          //     var data_nest=d3.nest()
          //                     .key(function(d){return d.reporting_id})
          //                     .entries(data)
          //     data_nest.forEach(function(d){
          //       d["reporting"]=d.values[0]["reporting"];
          //       d["continent"]=d.values[0]["continent"];
          //     })

              // transform array of string in array of int
            //   data.forEach(function (r) {
            //     r.years = r.years.split(',')
            //                        .map(function (e) {
            //                       return e = parseInt(e)
            //                     })
            //   })

            //   $scope.matrix = data
            // })
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


            // $scope.$watch("stackchartFlow", function (newVal,oldVal){

            // })//not trigered when change...

            $scope.changeStackFlow = function (flow) {
                $scope.stackchartFlow=flow;
            }
            $scope.changeMatrixFlow = function (flow) {
                $scope.matrixFlow=flow;
            }
            $scope.changeStackLayout = function (layout) {
              $scope.stackchartLayout = layout;
              ;
            }
            $scope.changeMatrixLayout = function (layout) {
              $scope.matrixLayout = layout;
              ;
            }

            // d3.csv("../overview.csv",function(data){

                // $scope.data=data;
                var data_nest=d3.nest()
                                .key(function(d){return d.reporting})
                                .entries(data)

                data_nest.forEach(function(d){
                  d["continent"]=d.values[0]["continent"];
                })

                var nbReportings=d3.nest()
                                     .key(function(d) { return d.year; })
                                     .rollup(function(v) { return {
                                        nb_reporting:v.length,
                                        exp_flow: d3.sum(v,function(d){return d.export}),
                                        imp_flow: d3.sum(v,function(d){return d.import}),
                                        total_flow: d3.sum(v,function(d){return d.total})
                                        }
                                      })
                                     .entries(data);

                $scope.nbReportings=[]
                nbReportings.forEach(function(d){
                  $scope.nbReportings.push({
                    year:d.key,
                    nb_reporting:d.values.nb_reporting,
                    flows:d.values.total_flow
                  })
                })

                $scope.rawMinDate = d3.min( $scope.nbReportings, function(d) { return d.year; })
                $scope.rawMaxDate = d3.max( $scope.nbReportings, function(d) { return d.year; })

                /*
                 * Check if dates were in localstorage
                 */
                var minDate = parseInt(localStorage.getItem('selectedMinDate'));
                var maxDate = parseInt(localStorage.getItem('selectedMaxDate'));
                $scope.selectedMinDate = minDate ?
                  minDate : Math.max( $scope.selectedMinDate, $scope.rawMinDate );
                $scope.selectedMaxDate = maxDate ?
                  maxDate : Math.min( $scope.selectedMaxDate, $scope.rawMaxDate );

                console.log(data);
                var flowContinent=d3.nest()
                                        .key(function(d) { return d.continent; })
                                        .key(function(d) { return d.year; })
                                        .rollup(function(v){ return {
                                            exp_flow: d3.sum(v,function(d){return d.exp_flow}),
                                            imp_flow: d3.sum(v,function(d){return d.imp_flow}),
                                            total_flow: d3.sum(v,function(d){return d.total_flow}),
                                            exp_partner:d3.sum(v,function(d){return d.exp_partner.split("|").length;}),
                                            imp_partner:d3.sum(v,function(d){return d.imp_partner.split("|").length;}),
                                            total_partner:d3.sum(v,function(d){return d.total_partner.split("|").length;}),
                                            reportings: v.length
                                          }
                                        })
                                        .entries(data);

                //extend missing points with 0 values
                flowContinent.forEach(function(d){
                    for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
                      var years=d.values.map(function(year){ return year.key});
                      if (years.indexOf(i.toString())=== -1){
                        d.values.push({
                          key:i,
                          values:{
                            exp_flow:0,
                            imp_flow:0,
                            total_flow: 0,
                            total_partner:0,
                            exp_partner:0,
                            imp_partner:0,
                            reportings:0
                          }
                        })
                      }
                    }
                  //sort by year ascending
                  d.values.sort(function(a,b){
                    return a.key-b.key;
                  });
                })//add missing with 0

                $scope.flatContinent=[]
                flowContinent.forEach(function(d){
                  d.values.forEach(function(v){
                    $scope.flatContinent.push(
                      {
                        "continent":d.key,
                        "year":+v.key,
                        "values":v.values
                      }
                    )
                  })
                })

                $scope.flowEntities=d3.nest()
                      .key(function(d) { return d.reporting; })
                      .entries(data);
                $scope.flowEntities.forEach(function(d){
                  d.values.forEach(function(v){
                    v.exp_partner=v.exp_partner.split("|").length;
                    v.imp_partner=v.imp_partner.split("|").length;
                    v.total_partner=v.total_partner.split("|").length;
                  })
                })
          })
        }

        init()

        $scope.export = function () {
          var dataExported = [];
          $scope.data.forEach(function (d) {
            dataExported.push({
              reporting:d.reporting,
              year:d.year,
              export:d.export,
              import:d.import,
              total:d.total,
              exp_partner:d.exp_partners,
              imp_partner:d.imp_partners,
              total_partner:d.total_partners,
              source:d.total_sources,
              continent:d.continent
            })
          });

          var headers = ["reporting", "year", "export", "import", "total", "exp_partner","imp_partner","total_partner","source","continent"],
              order = "",
              filename = "Database_Overview";
          utils.downloadCSV(dataExported, headers, order, filename);
        }
        $scope.sortReportings = function(newVal) {
          $scope.changed = newVal.type.value;
        }
 }])