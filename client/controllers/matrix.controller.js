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
      $scope.partners= $scope.partnersChoices[0]
      $scope.worldpartner=$scope.partners.type.value==="worldestimate" ? true:false;

      updatePartner()

      $scope.flowChoices = [
      {type: {value: "total",writable: true},
       name: {value: "Total",writable: true}},
      {type: {value: "Exp",writable: true},
       name: {value: "Exports",writable: true}},
      {type: {value: "Imp",writable: true},
       name: {value: "Imports",writable: true}
      }];

      $scope.chartFlow = $scope.flowChoices[0]

      function updatePartner(){
         if($scope.worldpartner){
            $scope.multichartLayoutChoices = [
            {type: {value: "multiple",writable: true},
             name: {value: "Multiple View",writable: true}},
            {type: {value: "single",writable: true},
             name: {value: "Single View",writable: true}},
            ];
          }
          if(!$scope.worldpartner){
            $scope.multichartLayoutChoices = [
            {type: {value: "multiple",writable: true},
             name: {value: "Multiple View",writable: true}},
            {type: {value: "zero",writable: true},
             name: {value: "Stacked View",writable: true}},
            {type: {value: "expand",writable: true},
             name: {value: "Percentage View",writable: true}},
            ];
          }

          $scope.multichartLayout = $scope.multichartLayoutChoices[0]


          if($scope.worldpartner){
            $scope.matrixLayoutChoices = [
            {type: {value: "years",writable: true},
             name: {value: "Number of Reporting Years",writable: true}},
             {type: {value: "flowAvg",writable: true},
             name: {value: "Flows in Average",writable: true}},
            ];
          }
          if(!$scope.worldpartner){
            $scope.matrixLayoutChoices = [
            {type: {value: "years",writable: true},
             name: {value: "Number of Reporting Years",writable: true}},
             {type: {value: "flowAvg",writable: true},
             name: {value: "Flows in Average",writable: true}},
            {type: {value: "partnerAvg",writable: true},
             name: {value: "Partners in Average",writable: true}},
            ];
          }
          $scope.matrixLayout = $scope.matrixLayoutChoices[0]

          if($scope.worldpartner){
            $scope.matrixColorChoices = [
             {type: {value: "reference",writable: true},
             name: {value: "World Partner",writable: true}},
             {type: {value: "flow",writable: true},
             name: {value: "Trade Flows",writable: true}},
             {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
            ];
          }
          if(!$scope.worldpartner){
            $scope.matrixColorChoices = [
             {type: {value: "flow",writable: true},
             name: {value: "Trade Flows",writable: true}},
             {type: {value: "partner",writable: true},
             name: {value: "Number of Partners",writable: true}},
             {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
            ];
          }
          $scope.matrixColorBy = $scope.matrixColorChoices[0]
        }



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
          updatePartner()
          init();
      }

      $scope.changeFlow = function (flow) {
          $scope.chartFlow=flow;
          if(!$scope.worldpartner) reporting_proc($scope.data)
          else world_proc($scope.data)
      }

      $scope.changeMultiLayout = function (layout) {
        $scope.multichartLayout = layout;
        ;
      }
      $scope.changeMatrixLayout = function (layout) {
        $scope.matrixLayout = layout;
        ;
      }
      $scope.changeMatrixColor = function (colorBy) {
        $scope.matrixColorBy = colorBy;
      }

      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }

      function reporting_proc(data){
        var flow=data.filter(function(d){return d.expimp===$scope.chartFlow.type.value});

        flow.forEach(function(d){
            d.partner_continent=[]
            d.partner.forEach(function(p){
              d.partner_continent.push(p.split("-")[1])
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
            d.partner=d.partner.length
            d.partner_continent=continents.sort(function(a,b){return b.number-a.number;});

          });
          var data_nest=d3.nest()
                          .key(function(d){return d.reporting})
                          .entries(flow)

            data_nest.forEach(function(d){
              d["continent"]=d.values[0]["continent"];
            })

            var nbReportings=d3.nest()
                                 .key(function(d) { return d.year; })
                                 .rollup(function(v) { return {
                                    nb_reporting:v.length
                                    }
                                  })
                                 .entries(flow);

            $scope.nbReportings=[]
            nbReportings.forEach(function(d){
              $scope.nbReportings.push({
                year:d.key,
                nb_reporting:d.values.nb_reporting,
                flows:d.values.flow
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
                                        flow: d3.sum(v,function(d){return d.flow}),
                                        reportings: v.length
                                      }
                                    })
                                    .entries(flow);

            //extend missing points with 0 values
            flowContinent.forEach(function(d){
                for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
                  var years=d.values.map(function(year){ return year.key});
                  if (years.indexOf(i.toString())=== -1){
                    d.values.push({
                      key:i,
                      values:{
                        flow:0,
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
                  .entries(flow);

            $scope.flowEntities.forEach(function(d){
              var flow_sum=d3.sum(d.values,function(d){return d.flow})
              var partner_sum=d3.sum(d.values,function(d){return d.partner})
              d.flowAvg=d3.round(flow_sum/d.values.length,2)
              d.partnerAvg=d3.round(partner_sum/d.values.length)
              d.years=d.values.length
            })

            $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})

      }
      function world_proc(data){
        var flow=data.filter(function(d){return d.expimp===$scope.chartFlow.type.value});

        $scope.flowWorld=d3.nest()
                              .key(function(d) { return d.partner; })
                              .key(function(d) { return d.year; })
                              .rollup(function(v){ return {
                                  flow: d3.sum(v,function(d){return d.flow}),
                                  reportings: v.length
                                }
                              })
                              .entries(flow);

          //extend missing points with null values
          $scope.flowWorld.forEach(function(d){
              // for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
              d.values.forEach(function(v){
                v.key=+v.key
              })
              for (var i = 1787; i<=1939;i++){
                var years=d.values.map(function(year){ return year.key});
                if (years.indexOf(i)=== -1){
                  d.values.push({
                    key:i,
                    values:{
                      flow: null,
                      reportings:null
                    }
                  })
                }
              }
              //sort by year ascending
              d.values.sort(function(a,b){
                return a.key-b.key;
              });
          })//add missing with null

          $scope.flowWorld=$scope.flowWorld.filter(function(d){return d.key!=="World_best_guess"});

          var worldEntities=d3.nest()
                    .key(function(d) { return d.reporting; })
                    .key(function(d) { return d.year; })
                    .entries(flow);

          var worldbestguess=[]
          worldEntities.forEach(function(d){
            d.values.forEach(function(e){
              e.values.forEach(function(p){
                 if (p.partner==="World_best_guess") e.worldbestguess=p
              })
              if(e.values.length===2){
                e.values.forEach(function(p){
                  if (p.partner!=="World_best_guess") {
                    e.worldbestguess.reference=p.partner
                  }
                })
              }
              else{
                e.values.forEach(function(p,i){
                  if (p.partner!=="World_best_guess" && p.flow===e.worldbestguess.flow) e.worldbestguess.reference=p.partner
                })
              }
              worldbestguess.push(e.worldbestguess)
            })
          })
          $scope.flowEntities=d3.nest()
                    .key(function(d) { return d.reporting; })
                    .entries(worldbestguess);
          $scope.flowEntities.forEach(function(d){
            var flow_sum=d3.sum(d.values,function(d){return d.flow})
            d.flowAvg=d3.round(flow_sum/d.values.length,2)
            d.years=d.values.length
          })
          $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
      }
      function init() {
        if(!$scope.worldpartner){
           apiService
            .getReportingsAvailableByYear()
            .then(function (data){
              //data manipulation
              $scope.data=data;
              reporting_proc(data)

          })
        }
        if($scope.worldpartner){
           apiService
            .getWorldAvailable()
            .then(function (data){
              //data manipulation
              $scope.data=data;
              world_proc(data);
          })
        }

          // if(!$scope.worldpartner) {
          //    d3.csv("../overview.csv",function(data){
          //       data.forEach(function(d){
          //         d.exp_partner=d.exp_partner.split("|").length
          //         // d.imp_partner=d.imp_partner.split("|").length
          //         d.total_partner=d.total_partner.split("|").length
          //         var exp_continent=d3.nest()
          //                           .key(function(d){return d})
          //                           .rollup(function(values) { return values.length; })
          //                           .map(d.exp_continent.split("|"));

          //         // var imp_continent=d3.nest()
          //         //                   .key(function(d){return d})
          //         //                   .rollup(function(values) { return values.length; })
          //         //                   .map(d.imp_continent.split("|"));

          //         var exp =[]
          //         var imp =[]
          //         var exp_keys= d3.keys(exp_continent);
          //         // var imp_keys= d3.keys(imp_continent);
          //         exp_keys.forEach(function(d){
          //           // continent.push(exp_keys);
          //           exp.push({
          //             "continent":d,
          //             "number":exp_continent[d]
          //           })
          //         })
          //         // imp_keys.forEach(function(d){
          //         //   imp.push({
          //         //     "continent":d,
          //         //     "number":exp_continent[d]
          //         //   })
          //         // })
          //         d.exp_continent=exp.sort(function(a,b){return b.number-a.number;});
          //         // d.imp_continent=imp.sort(function(a,b){return b.number-a.number;});
          //           });

          //         var data_nest=d3.nest()
          //                         .key(function(d){return d.reporting})
          //                         .entries(data)

          //           data_nest.forEach(function(d){
          //             d["continent"]=d.values[0]["continent"];
          //           })

          //           var nbReportings=d3.nest()
          //                                .key(function(d) { return d.year; })
          //                                .rollup(function(v) { return {
          //                                   nb_reporting:v.length,
          //                                   exp_flow: d3.sum(v,function(d){return d.export}),
          //                                   imp_flow: d3.sum(v,function(d){return d.import}),
          //                                   total_flow: d3.sum(v,function(d){return d.total})
          //                                   }
          //                                 })
          //                                .entries(data);

          //           $scope.nbReportings=[]
          //           nbReportings.forEach(function(d){
          //             $scope.nbReportings.push({
          //               year:d.key,
          //               nb_reporting:d.values.nb_reporting,
          //               flows:d.values.total_flow
          //             })
          //           })

          //           $scope.rawMinDate = d3.min( $scope.nbReportings, function(d) { return d.year; })
          //           $scope.rawMaxDate = d3.max( $scope.nbReportings, function(d) { return d.year; })

          //           /*
          //            * Check if dates were in localstorage
          //            */
          //           var minDate = parseInt(localStorage.getItem('selectedMinDate'));
          //           var maxDate = parseInt(localStorage.getItem('selectedMaxDate'));
          //           $scope.selectedMinDate = minDate ?
          //             minDate : Math.max( $scope.selectedMinDate, $scope.rawMinDate );
          //           $scope.selectedMaxDate = maxDate ?
          //             maxDate : Math.min( $scope.selectedMaxDate, $scope.rawMaxDate );


          //           var flowContinent=d3.nest()
          //                                   .key(function(d) { return d.continent; })
          //                                   .key(function(d) { return d.year; })
          //                                   .rollup(function(v){ return {
          //                                       exp_flow: d3.sum(v,function(d){return d.exp_flow}),
          //                                       imp_flow: d3.sum(v,function(d){return d.imp_flow}),
          //                                       total_flow: d3.sum(v,function(d){return d.total_flow}),
          //                                       exp_partner:d3.sum(v,function(d){return d.exp_partner;}),
          //                                       imp_partner:d3.sum(v,function(d){return d.imp_partner;}),
          //                                       total_partner:d3.sum(v,function(d){return d.total_partner;}),
          //                                       reportings: v.length
          //                                     }
          //                                   })
          //                                   .entries(data);

          //           //extend missing points with 0 values
          //           flowContinent.forEach(function(d){
          //               for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
          //                 var years=d.values.map(function(year){ return year.key});
          //                 if (years.indexOf(i.toString())=== -1){
          //                   d.values.push({
          //                     key:i,
          //                     values:{
          //                       exp_flow:0,
          //                       imp_flow:0,
          //                       total_flow: 0,
          //                       total_partner:0,
          //                       exp_partner:0,
          //                       imp_partner:0,
          //                       reportings:0
          //                     }
          //                   })
          //                 }
          //               }
          //             //sort by year ascending
          //             d.values.sort(function(a,b){
          //               return a.key-b.key;
          //             });
          //           })//add missing with 0

          //           $scope.flatContinent=[]
          //           flowContinent.forEach(function(d){
          //             d.values.forEach(function(v){
          //               $scope.flatContinent.push(
          //                 {
          //                   "continent":d.key,
          //                   "year":+v.key,
          //                   "values":v.values
          //                 }
          //               )
          //             })
          //           })

          //           $scope.flowEntities=d3.nest()
          //                 .key(function(d) { return d.reporting; })
          //                 .entries(data);

          //           $scope.flowEntities.forEach(function(d){
          //             var flow_sum=d3.sum(d.values,function(d){return d.total_flow})
          //             var partner_sum=d3.sum(d.values,function(d){return d.total_partner})
          //             d.flowAvg=d3.round(flow_sum/d.values.length,2)
          //             d.partnerAvg=d3.round(partner_sum/d.values.length)
          //             d.years=d.values.length
          //           })

          //           $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
          //         })//d3 load data
          //       }//data prepare for actualreported case


          //     if($scope.worldpartner){
          //       d3.csv("../world_overview.csv",function(data){
          //       $scope.flowWorld=d3.nest()
          //                           .key(function(d) { return d.partner; })
          //                           .key(function(d) { return d.year; })
          //                           .rollup(function(v){ return {
          //                               exp_flow: d3.sum(v,function(d){return d.exp_flow}),
          //                               imp_flow: d3.sum(v,function(d){return d.imp_flow}),
          //                               total_flow: d3.sum(v,function(d){return d.total_flow}),
          //                               reportings: v.length
          //                             }
          //                           })
          //                           .entries(data);

          //       //extend missing points with null values
          //       $scope.flowWorld.forEach(function(d){
          //           // for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
          //           d.values.forEach(function(v){
          //             v.key=+v.key
          //           })
          //           for (var i = 1738; i<=1939;i++){
          //             var years=d.values.map(function(year){ return year.key});
          //             if (years.indexOf(i)=== -1){
          //               d.values.push({
          //                 key:i,
          //                 values:{
          //                   exp_flow:null,
          //                   imp_flow:null,
          //                   total_flow: null,
          //                   reportings:null
          //                 }
          //               })
          //             }
          //           }
          //           //sort by year ascending
          //           d.values.sort(function(a,b){
          //             return a.key-b.key;
          //           });
          //       })//add missing with null

          //       $scope.flowWorld=$scope.flowWorld.filter(function(d){return d.key!=="World_best_guess"});

          //       var worldEntities=d3.nest()
          //                 .key(function(d) { return d.reporting; })
          //                 .key(function(d) { return d.year; })
          //                 .entries(data);

          //       var worldbestguess=[]
          //       worldEntities.forEach(function(d){
          //         d.values.forEach(function(e){
          //           e.values.forEach(function(p){
          //              if (p.partner==="World_best_guess") e.worldbestguess=p
          //           })
          //           if(e.values.length===2){
          //             e.values.forEach(function(p){
          //               if (p.partner!=="World_best_guess") {
          //                 e.worldbestguess.reference=p.partner
          //               }
          //             })
          //           }
          //           else{
          //             e.values.forEach(function(p,i){
          //               if (p.partner!=="World_best_guess" && p.exp_flow===e.worldbestguess.exp_flow) e.worldbestguess.reference=p.partner
          //             })
          //           }
          //           worldbestguess.push(e.worldbestguess)
          //         })
          //       })
          //       $scope.flowEntities=d3.nest()
          //                 .key(function(d) { return d.reporting; })
          //                 .entries(worldbestguess);
          //       $scope.flowEntities.forEach(function(d){
          //         var flow_sum=d3.sum(d.values,function(d){return d.total_flow})
          //         d.flowAvg=d3.round(flow_sum/d.values.length,2)
          //         d.years=d.values.length
          //       })
          //       $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})
          //       // console.log($scope.flowEntities)
          //       })
          //     }//data prepare for worldpartner case
           // })
        }

        init()

        $scope.export = function () {
          var dataExported = [];
          if($scope.worldpartner){
            $scope.data.forEach(function (d) {
            dataExported.push({
              reporting_id:d.reporting_id,
              reporting:d.reporting,
              year:d.year,
              exp_flow:d.exp_flow,
              imp_flow:d.imp_flow,
              total_flow:d.total_flow,
              partner:d.partner,
              // exp_partner:d.exp_partner,
              // imp_partner:d.imp_partner,
              source:d.source,
              sourcetype:d.sourcetype,
              continent:d.continent,
              type:d.type
            })
          });

          var headers = ["reporting_id","reporting", "year", "exp_flow", "imp_flow", "total_flow","partner","source","sourcetype","continent","type"],
              order = "",
              filename = "Metadata_Overview_world";
          }

          if(!$scope.worldpartner){
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
                  filename = "Metadata_Overview";
          }
          utils.downloadCSV(dataExported, headers, order, filename);
        }
 }])