'use strict';

/* Directives */


angular.module('ricardo.directives', [])
  .directive('navbar',[ 'fileService', '$timeout', function (fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

      }
    }
  }])
  .directive('stackedTimeline',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

        var timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
        
        function init(){
          
          apiService
            .getFlows('data/bilateral_france_UK.json')
            //.getFlows('data/bilateral_france_all.json')
            .then(
              function(data){
                var flows = data.flows_in_pounds,
                    mirror_flows = data.mirror_flows || [];
                
                cfSource.add(flows);
                cfTarget.add(mirror_flows);

                scope.startDate = cfSource.year().bottom(1)[0].year
                scope.endDate = cfSource.year().top(1)[0].year
                
                scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
                
                scope.reportings = data.meta.reportings
                scope.partners = data.meta.partners

                scope.streamData = [
                  {key:"first", values:[
                    {y: cfSource.imp(), x:0, key:"first"},
                    {y: cfTarget.exp(), x:1, key:"second"}
                    ]
                  },
                  {key:"second", values:[
                    {y: cfSource.exp(), x:0, key:"second"},
                    {y: cfTarget.imp(), x:1, key:"first"}
                    ]
                  }
                ]

                flows.sort(function(a, b){ return d3.ascending(a.year, b.year); })
                flows.forEach(function(d){
                  timelineData[0].values.push({total: d.imp, year: new Date(d.year, 0, 1)})
                  timelineData[1].values.push({total: d.exp, year: new Date(d.year, 0, 1)})
                })
                
                var stacked = ricardo.stackedBar()
                  .width(element.width())
                  .height(200)
                  .stackColors(["#7CA49E", "#D35530"])
                  .on("brushing", function(d){
                    scope.startDate = d[0].getFullYear()
                    scope.endDate = d[1].getFullYear()
                    if(!scope.$$phase) {
                      scope.$apply()
                    }
                  })
                  .on("brushed", function(d){
                    cfSource.year().filterRange(d)
                    cfTarget.year().filterRange(d)

                    scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
                    scope.streamData = [
                      {key:"first", values:[
                        {y: cfSource.imp(), x:0, key:"first"},
                        {y: cfTarget.exp(), x:1, key:"second"}
                        ]
                      },
                      {key:"second", values:[
                        {y: cfSource.exp(), x:0, key:"second"},
                        {y: cfTarget.imp(), x:1, key:"first"}
                        ]
                      }
                    ]
                    if(!scope.$$phase) {
                      scope.$apply()
                    }
                  })

                var chart = d3.select(element[0])
                chart.datum(timelineData).call(stacked)

                d3.select('.timeline-cont').classed("timeline-open", true)
                d3.select('.table-cont').classed("table-cont-open", true)

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

        init()
        scope.$watch("sourceEntity.selected", function(newValue, oldValue){
          if(newValue != oldValue){
            //init()
          }
        })

      }
    }
  }])
  .directive('stream',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

          var stream = ricardo.stream()
            .width(element.width())
            .height(200)
            .stackColors(["#7CA49E", "#D35530"])

          var chart = d3.select(element[0])

        scope.$watch("streamData", function(newValue, oldValue){
          if(newValue != oldValue){
            chart.datum(newValue).call(stream)
          }
        })

      }
    }
  }])
  .directive('streamLegend',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'partials/stream-legend.html',
      link: function(scope, element, attrs) {

        var reportingCont = element.find(".rep")[0],
            partnerCont = element.find(".pat")[0]

        var format = d3.format("0,000");

        function update(data){

          element.find(".rep").empty()
          element.find(".pat").empty()

          d3.select(reportingCont).append("h4")
            .text("imported to " + scope.partners.join())

          d3.select(reportingCont).append("p")
            .text("£ " + format(Math.round(data[0].values[0].y)))

          d3.select(reportingCont).append("h4")
            .text("exported to " + scope.partners.join())

          d3.select(reportingCont).append("p")
            .text("£ " + format(Math.round(data[1].values[0].y)))

          d3.select(partnerCont).append("h4")
            .text("exported to " + scope.reportings.join())

          d3.select(partnerCont).append("p")
            .text("£ " + format(Math.round(data[0].values[1].y)))

          d3.select(partnerCont).append("h4")
            .text("imported to " + scope.reportings.join())

          d3.select(partnerCont).append("p")
            .text("£ " + format(Math.round(data[1].values[1].y)))

        }

        scope.$watch("streamData", function(newValue, oldValue){
          if(newValue != oldValue){
            update(newValue)
          }
        })

      }
    }
  }])