'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

      var yearsDelta = d3.range(1787, 1940)


      $scope.partnersChoices = [
      {type: {value: "",writable: true},
       name: {value: "Actual Reported",writable: true}
       },
      {type: {value: "Worldbestguess",writable: true},
       name: {value: "World Best Guess",writable: true}
      },
      {type: {value: "Worldasreported",writable: true},
       name: {value: "World Reported",writable: true}
      },
      {type: {value: "Worldsumpartners",writable: true},
       name: {value: "World Sum Partners",writable: true}
      },
      {type: {value: "Worldasreported2",writable: true},
       name: {value: "World Sub-Reporting",writable: true}
      },
      {type: {value: "Worldestimated",writable: true},
       name: {value: "World Estimated",writable: true}
      },
      ]
      $scope.partners= $scope.partnersChoices[0]


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
      $scope.stackchartLayout = $scope.stackchartLayoutChoices[0]

      $scope.matrixLayoutChoices = [
        {type: {value: "coverage",writable: true},
         name: {value: "Coverage",writable: true}},
         {type: {value: "continent",writable: true},
         name: {value: "Continent",writable: true}},
         {type: {value: "type",writable: true},
         name: {value: "Entity Type",writable: true}},
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

      $scope.changePartner = function (partners) {
          $scope.partners=partners;
          init();
      }

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

      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }

      function init() {
          apiService
            .getReportingsAvailableByYear(
              {partner_ids:$scope.partners.type.value
              })
            .then(function (data){
              //data manipulation
              $scope.data=data;

          // d3.csv("../overview.csv",function(data){
            //preprocess data
            data.forEach(function(d){
              d.exp_partner=d.exp_partner.split("|").length
              // d.imp_partner=d.imp_partner.split("|").length
              d.total_partner=d.total_partner.split("|").length
              var exp_continent=d3.nest()
                                .key(function(d){return d})
                                .rollup(function(values) { return values.length; })
                                .map(d.exp_continent.split("|"));

              // var imp_continent=d3.nest()
              //                   .key(function(d){return d})
              //                   .rollup(function(values) { return values.length; })
              //                   .map(d.imp_continent.split("|"));

              var exp =[]
              var imp =[]
              var exp_keys= d3.keys(exp_continent);
              // var imp_keys= d3.keys(imp_continent);
              exp_keys.forEach(function(d){
                exp.push({
                  "continent":d,
                  "number":exp_continent[d]
                })
              })
              // imp_keys.forEach(function(d){
              //   imp.push({
              //     "continent":d,
              //     "number":exp_continent[d]
              //   })
              // })
              d.exp_continent=exp.sort(function(a,b){return b.number-a.number;});
              // d.imp_continent=imp.sort(function(a,b){return b.number-a.number;});
            });

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


                var flowContinent=d3.nest()
                                        .key(function(d) { return d.continent; })
                                        .key(function(d) { return d.year; })
                                        .rollup(function(v){ return {
                                            exp_flow: d3.sum(v,function(d){return d.exp_flow}),
                                            imp_flow: d3.sum(v,function(d){return d.imp_flow}),
                                            total_flow: d3.sum(v,function(d){return d.total_flow}),
                                            exp_partner:d3.sum(v,function(d){return d.exp_partner;}),
                                            imp_partner:d3.sum(v,function(d){return d.imp_partner;}),
                                            total_partner:d3.sum(v,function(d){return d.total_partner;}),
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

                $scope.entities=$scope.flowEntities.map(function(d){return d.key;})

                // $scope.flowEntities.forEach(function(d){
                //   d.values.forEach(function(v){
                //     v.exp_partner=v.exp_partner.split("|").length;
                //     v.imp_partner=v.imp_partner.split("|").length;
                //     v.total_partner=v.total_partner.split("|").length;
                //   })
                // })
                // //extend missing points with 0 values
                // $scope.flowEntities.forEach(function(d){
                //     for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
                //       var years=d.values.map(function(v){ return v.year});
                //       if (years.indexOf(i.toString())=== -1){
                //         d.values.push({
                //             year:i,
                //             exp_flow:null,
                //             imp_flow:null,
                //             total_flow: null,
                //             total_partner:null,
                //             exp_partner:null,
                //             imp_partner:null,
                //             source:null,
                //             sourcetype:null,
                //             reportings:d.key,
                //             continent:d.values[0].continent
                //         })
                //       }
                //     }
                //   //sort by year ascending
                //   d.values.sort(function(a,b){
                //     return a.year-b.year;
                //   });
                // })//add missing with null

            // })
          })
        }

        init()
        $scope.export = function () {
          var dataExported = [];
          $scope.data.forEach(function (d) {
            dataExported.push({
              reporting_id:d.reporting_id,
              reporting:d.reporting,
              year:d.year,
              exp_flow:d.exp_flow,
              imp_flow:d.imp_flow,
              total_flow:d.total_flow,
              exp_partner:d.exp_partner,
              exp_continent:d.exp_continent,
              exp_type:d.exp_type,
              imp_partner:d.imp_partner,
              imp_continent:d.imp_continent,
              imp_type:d.imp_type,
              total_partner:d.total_partner,
              source:d.source,
              sourcetype:d.sourcetype,
              continent:d.continent,
              type:d.type
            })
          });

          var headers = ["reporting_id","reporting", "year", "exp_flow", "imp_flow", "total_flow", "exp_partner","exp_continent","exp_type","imp_partner","imp_continent","imp_type","total_partner","source","sourcetype","continent","type"],
              order = "",
              filename = "Database_Overview";
          utils.downloadCSV(dataExported, headers, order, filename);
        }
        $scope.sortReportings = function(newVal) {
          $scope.changed = newVal.type.value;
        }
 }])