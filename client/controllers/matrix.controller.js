'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

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
            ];
      $scope.matrixLayout = $scope.matrixLayoutChoices[0]

      $scope.matrixColorChoices = [
             {type: {value: "reference",writable: true},
             name: {value: "World Partner",writable: true}},
             {type: {value: "partner",writable: true},
             name: {value: "Number of Partners",writable: true}},
             {type: {value: "mirror_rate",writable: true},
             name: {value: "Bilateral Rate",writable: true}},
             {type: {value: "sourcetype",writable: true},
             name: {value: "Source Type",writable: true}},
             {type: {value: "type",writable: true},
             name: {value: "Reporting Type",writable: true}},
             {type: {value: "continent",writable: true},
             name: {value: "Reporting Continent",writable: true}},
            ];

      $scope.matrixColorBy=$scope.matrixColorChoices[0]

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
       name: {value: "Exports",writable: true}},
      {type: {value: "Imp",writable: true},
       name: {value: "Imports",writable: true}
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

      $scope.changeFlow = function (flow) {
          $scope.chartFlow=flow;
          reprocess($scope.data)
      }

      $scope.changeSynCurve = function (curveBy) {
        $scope.synCurveBy = curveBy;
        // group_reporting($scope.flow,curveBy.type.value)

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

      //quick nav
      $scope.reporting;
      $scope.search=0;
      $scope.find= function(reporting){
        $scope.reporting=reporting;
        $scope.search+=1;
      }
      function reprocess(data){
        //data manipulation
        $scope.rawMinDate = d3.min(data, function(d) { return +d.year; })
        $scope.rawMaxDate = d3.max(data, function(d) { return +d.year; })
          var flow=data.filter(function(d){return d.expimp===$scope.chartFlow.type.value});
          var actualData=flow.filter(function(d){return d.partnertype==="actual"})
          var worldData=flow.filter(function(d){return d.partnertype==="world"})
          //actualData proc
          actualData.forEach(function(d){
            d.year=+d.year;
            d.partner=[]
            d.partner_continent=[]
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
          //worldData proc
          var worldEntities=d3.nest()
                .key(function(d) { return d.reporting; })
                .key(function(d) { return d.year; })
                .entries(worldData);

          var worldbestguess=[]
          worldEntities.forEach(function(d){
            d.values.forEach(function(e){
              e.values.forEach(function(p){
                 if (p.partners==="World_best_guess") e.worldbestguess=p
              })
              if(e.values.length===2){
                e.values.forEach(function(p){
                  if (p.partners!=="World_best_guess") {
                    e.worldbestguess.reference=p.partners
                  }
                })
              }
              else{
                e.values.forEach(function(p,i){
                  if (p.partners!=="World_best_guess" && p.flow===e.worldbestguess.flow) e.worldbestguess.reference=p.partners
                })
              }
              e.worldbestguess.partner=["World_best_guess"];
              worldbestguess.push(e.worldbestguess)
            })
          })

          flow=actualData.concat(worldbestguess)
          var flowEntities=d3.nest()
                .key(function(d) { return d.reporting; })
                .key(function(d) { return d.year; })
                .entries(flow);

          var flowEntities_uniq=[]
          flowEntities.forEach(function(d){
            d.values.forEach(function(v){
              if(v.values.length>1){
                v.values.forEach(function(e){
                  if (e.partnertype==="actual") flowEntities_uniq.push(e)
                })
              }
              else flowEntities_uniq.push(v.values[0])
            })
          })

          flowEntities_uniq.forEach(function(d){
            if(d.partnertype==="actual"){
                d.partner_mirror=d.partners_mirror
                d.partner_intersect = d.partner.filter(function(value) {
                                       return d.partner_mirror.indexOf(value) > -1;
                                   });
                // d.mirror_rate=d.partner_intersect.length/d.partner.length
                d.mirror_rate=2*d.partner_intersect.length/(d.partner.length+d.partner_mirror.length)
            }
          })
          $scope.flow=flowEntities_uniq
          $scope.flowEntities=d3.nest()
              .key(function(d) { return d.reporting; })
              .entries(flowEntities_uniq);
          $scope.flowEntities.forEach(function(d){
            var partner_sum=d3.sum(d.values,function(d){return d.partner.length})
            d.partnerAvg=d3.round(partner_sum/d.values.length)
            d.years=d.values.length
          })
          $scope.entities=$scope.flowEntities.map(function(d){return d.values[0].reporting_id;})

        //   //reporting by continent
        //   var reportingContinent=d3.nest()
        //                         .key(function(d) { return d.continent; })
        //                         .key(function(d) { return +d.year; })
        //                         .rollup(function(v){ return {
        //                             reportings: v.length
        //                           }
        //                         })
        //                         .entries(flow);

        // //extend missing points with 0 values
        // reportingContinent.forEach(function(d){
        //     for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
        //       var years=d.values.map(function(year){ return year.key});
        //       if (years.indexOf(i.toString())=== -1){
        //         d.values.push({
        //           key:i,
        //           values:{
        //             reportings:0
        //           }
        //         })
        //       }
        //     }
        //   //sort by year ascending
        //   d.values.sort(function(a,b){
        //     return a.key-b.key;
        //   });
        // })//add missing with 0

        // $scope.flatContinent=[]
        // reportingContinent.forEach(function(d){
        //   d.values.forEach(function(v){
        //     $scope.flatContinent.push(
        //       {
        //         "continent":d.key,
        //         "year":+v.key,
        //         "values":v.values
        //       }
        //     )
        //   })
        // })
        //syncurve
        // group_reporting($scope.flow,$scope.matrixColorBy.type.value)
      }//end reprocess

      function init() {
           apiService
            .getReportingsAvailableByYear()
            .then(function (data){
              $scope.data=data
              reprocess(data)
            })
            // d3.csv("../metadata.csv",function(data){
            //   $scope.data=data;
            //   reprocess(data);
            // })
        }//end init

        init()

        $scope.export = function () {
          var dataExported = [];
            $scope.data.forEach(function (d) {
                dataExported.push({
                  reporting_id:d.reporting_id,
                  reporting:d.reporting,
                  year:d.year,
                  expimp:d.expimp,
                  flow:d.flow,
                  partners:d.partners,
                  partnertype:d.partnertype,
                  source:d.source,
                  sourcetype:d.sourcetype,
                  continent:d.continent,
                  type:d.type,
                  partners_mirror:d.partners_mirror
                })
              });

              var headers = ["reporting_id","reporting", "year", "expimp", "flow", "partners","partnertype","source","sourcetype","continent","type","partners_mirror"],
                  order = "",
                  filename = "metadata";

          utils.downloadCSV(dataExported, headers, order, filename);
        }
 }])