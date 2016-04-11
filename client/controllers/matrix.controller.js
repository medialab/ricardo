'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

      var yearsDelta = d3.range(1787, 1940)


      $scope.partnersChoices = [
      {type: {value: "actualreported",writable: true},
       name: {value: "Actual Reported",writable: true}
       },
      {type: {value: "worldestimate",writable: true},
       name: {value: "World Partners",writable: true}
      }
      ]
      $scope.partners= $scope.partnersChoices[1]
      $scope.worldpartner=$scope.partners.type.value==="worldestimate" ? true:false;

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
        {type: {value: "years",writable: true},
         name: {value: "Number of Reporting Years",writable: true}},
         {type: {value: "partner_avg",writable: true},
         name: {value: "Partners in Average",writable: true}},
         {type: {value: "flow_avg",writable: true},
         name: {value: "Flows in Average",writable: true}},
        ];
      $scope.matrixLayout = $scope.matrixLayoutChoices[0]

      $scope.matrixColorChoices = [
        {type: {value: "partners",writable: true},
         name: {value: "Number of Partners",writable: true}},
         {type: {value: "flows",writable: true},
         name: {value: "Trade Flows",writable: true}},
         {type: {value: "source",writable: true},
         name: {value: "Source Type",writable: true}},
         {type: {value: "reporting_type",writable: true},
         name: {value: "Reporting Type",writable: true}},
         {type: {value: "reporting_continent",writable: true},
         name: {value: "Reporting Continent",writable: true}},
        ];
      $scope.matrixColorBy = $scope.matrixColorChoices[0]


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
          $scope.worldpartner=partners.type.value==="worldestimate" ? true:false;
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
      $scope.changeMatrixColor = function (colorBy) {
        $scope.matrixColorBy = colorBy;
        console.log($scope.matrixColorBy)
      }

      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }

      function init() {
          // apiService
          //   .getReportingsAvailableByYear(
          //     {partner_ids:$scope.partners.type.value
          //     })
          //   .then(function (data){
          //     //data manipulation
          //     $scope.data=data;

          d3.csv("../world_overview.csv",function(data){
            //preprocess data
            // var continent=[]
            if(!$scope.worldpartner) {
                data.forEach(function(d){
                  d.exp_partner=d.exp_partner.split("|").length
                  d.imp_partner=d.imp_partner.split("|").length
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
                    // continent.push(exp_keys);
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

                    $scope.flowEntities.forEach(function(d){
                      // var flow_sum=d.values.map(function(d){return d.total_flow})
                      //               .reduce(function(a, b) {return (+a)+(+b) ; }, 0);
                      // var partner_sum=d.values.map(function(d){return d.total_partner})
                      //                 .reduce(function(a, b) {return (+a)+(+b) ; }, 0);

                      var flow_sum=d3.sum(d.values,function(d){return d.total_flow})
                      var partner_sum=d3.sum(d.values,function(d){return d.total_partner})

                      d.flowAvg=flow_sum/d.values.length
                      d.partnerAvg=partner_sum/d.values.length
                    })
                    console.log($scope.flowEntities)
                    $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
                }//data prepare for actualreported case

              if($scope.worldpartner){
                $scope.flowWorld=d3.nest()
                                    .key(function(d) { return d.partner; })
                                    .key(function(d) { return d.year; })
                                    .rollup(function(v){ return {
                                        exp_flow: d3.sum(v,function(d){return d.exp_flow}),
                                        imp_flow: d3.sum(v,function(d){return d.imp_flow}),
                                        total_flow: d3.sum(v,function(d){return d.total_flow}),
                                        reportings: v.length
                                      }
                                    })
                                    .entries(data);
                // $scope.flatWorld=[]
                //     flowWorld.forEach(function(d){
                //       d.values.forEach(function(v){
                //         $scope.flatWorld.push(
                //           {
                //             "continent":d.key,
                //             "year":+v.key,
                //             "values":v.values
                //           }
                //         )
                //       })
                // })

              }//data prepare for worldpartner case
          })
        }

        init()

        // $scope.export = function () {
        //   var dataExported = [];
        //   $scope.data.forEach(function (d) {
        //     dataExported.push({
        //       reporting_id:d.reporting_id,
        //       reporting:d.reporting,
        //       year:d.year,
        //       exp_flow:d.exp_flow,
        //       imp_flow:d.imp_flow,
        //       total_flow:d.total_flow,
        //       exp_partner:d.exp_partner,
        //       exp_continent:d.exp_continent,
        //       exp_type:d.exp_type,
        //       imp_partner:d.imp_partner,
        //       imp_continent:d.imp_continent,
        //       imp_type:d.imp_type,
        //       total_partner:d.total_partner,
        //       source:d.source,
        //       sourcetype:d.sourcetype,
        //       continent:d.continent,
        //       type:d.type
        //     })
        //   });

        //   var headers = ["reporting_id","reporting", "year", "exp_flow", "imp_flow", "total_flow", "exp_partner","exp_continent","exp_type","imp_partner","imp_continent","imp_type","total_partner","source","sourcetype","continent","type"],
        //       order = "",
        //       filename = "Database_Overview";
        //   utils.downloadCSV(dataExported, headers, order, filename);
        // }
        // $scope.export = function () {
        //   var dataExported = [];
        //   $scope.data.forEach(function (d) {
        //     dataExported.push({
        //       reporting_id:d.reporting_id,
        //       reporting:d.reporting,
        //       year:d.year,
        //       exp_flow:d.exp_flow,
        //       imp_flow:d.imp_flow,
        //       total_flow:d.total_flow,
        //       partner:d.partner,
        //       source:d.source,
        //       sourcetype:d.sourcetype,
        //       continent:d.continent,
        //       type:d.type
        //     })
        //   });

        //   var headers = ["reporting_id","reporting", "year", "exp_flow", "imp_flow", "total_flow", "partner","source","sourcetype","continent","type"],
        //       order = "",
        //       filename = "Database_Overview";
        //   utils.downloadCSV(dataExported, headers, order, filename);
        // }

 }])