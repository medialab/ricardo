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

        var timelineData;

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

        var chart = d3.select(element[0]);

        
        var init = function(sourceID, targetID){
          
          apiService
            //.getFlows('data/bilateral_france_UK.json')
            .getFlows({reporting_ids: sourceID, partner_ids: targetID})
            .then(
              function(data){
                var flows = data.flows,
                    mirror_flows = data.mirror_flows || [];
                
                if(!flows.length){
                  alert("no data for these Countries")
                  console.log("no data")
                  return
                }

                if(cfSource.size()>0){
                  cfSource.year().filterAll()
                  cfSource.type().filterAll()
                  cfSource.clear();
                }

                if(cfTarget.size()>0){
                  cfTarget.year().filterAll()
                  cfTarget.clear();
                }

                //cfSource.clear();
                //cfTarget.clear();

                cfSource.add(flows);
                cfTarget.add(mirror_flows);

                scope.startDate = cfSource.year().bottom(1)[0].year
                scope.endDate = cfSource.year().top(1)[0].year
                
                scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
                
                //useful meta re-implement it!
                //scope.reportings = data.meta.reportings
                //scope.partners = data.meta.partners
                scope.reportings = [scope.entities.sourceEntity.selected.RICname]
                scope.partners = [scope.entities.targetEntity.selected.RICname]

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

                timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
                flows.sort(function(a, b){ return d3.ascending(a.year, b.year); })
                flows.forEach(function(d){
                  timelineData[0].values.push({total: d.imp, year: new Date(d.year, 0, 1)})
                  timelineData[1].values.push({total: d.exp, year: new Date(d.year, 0, 1)})
                })
                
                update()

                d3.select('.timeline-cont').classed("timeline-open", true)
                d3.select('.table-cont').classed("table-cont-open", true)

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

        var update = function(){
          chart.datum(timelineData).call(stacked)
        }

        scope.$watchCollection('[entities.sourceEntity.selected, entities.targetEntity.selected]', function(newValue, oldValue){
          if(newValue != oldValue && newValue[0] && newValue[1]){
              init(newValue[0].RICid, newValue[1].RICid)
          }
        }, true)

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
  .directive('stackedTimelineCountry',[ 'cfSource', 'cfTarget', 'cfSourceLine', 'fileService', 'apiService', '$timeout',function (cfSource, cfTarget, cfSourceLine, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

        var timelineData;

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
            cfSourceLine.year().filterRange(d)

            scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
            scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})

            scope.linechartData = d3.nest().key(function(d){return d.reporting_id}).entries(cfSourceLine.year().top(Infinity))
            
            if(!scope.$$phase) {
              scope.$apply()
            }
          })

        var chart = d3.select(element[0])

                
        
        var init = function(sourceID){
          
          apiService
            .getFlows({reporting_ids: sourceID})
            .then(
              function(data){
                
                var flows = data.flows;

                if(!flows.length){
                  alert("no data for these Countries")
                  console.log("no data")
                  return
                }

                if(cfSource.size()>0){
                  cfSource.year().filterAll()
                  cfSource.clear();
                }

                scope.RICentities = {}

                data.RICentities.partners.forEach(function(d){
                  scope.RICentities[""+d.RICid] = {RICname : d.RICname, type: d.type, RICid: d.RICid }
                })


                scope.RICentitiesDD = d3.values(scope.RICentities).sort(function(a,b){
                      if(a.RICname < b.RICname) return -1;
                      if(a.RICname > b.RICname) return 1;
                      return 0;
                  })

                d3.select("#linechart-world > svg").remove()
                scope.reporting = []
                scope.entities.multiEntity = {}

                flows.forEach(function(d){
                  d.type = scope.RICentities[""+d.partner_id].type
                })
                
                cfSource.add(flows);

                scope.startDate = cfSource.year().bottom(1)[0].year
                scope.endDate = cfSource.year().top(1)[0].year
                
                scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
                

                scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})
                
                var flowsPerYear = cfSource.years().top(Infinity)

                timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
                
                flowsPerYear.sort(function(a, b){ return d3.ascending(a.key, b.key); })
                flowsPerYear.forEach(function(d){
                    timelineData[0].values.push({total: d.value.imp, year: d.key})
                    timelineData[1].values.push({total: d.value.exp, year: d.key})
                })

                update()

                d3.select('.timeline-cont').classed("timeline-open", true)
                d3.select('.table-cont').classed("table-cont-open", true)

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

        var initLinechart = function(sourceID, partnerID, startDate, endDate){
          var ids = sourceID.map(function(d){return d.RICid})
          apiService
            .getFlows({reporting_ids:ids.join(","), partner_ids: partnerID, from: startDate, to: endDate})
            .then(
              function(data){
                
                var flows = data.flows;

                if(!flows.length){
                  alert("no data")
                  console.log("no data")
                  return
                }

                if(cfSourceLine.size()>0){
                  cfSourceLine.year().filterAll()
                  cfSourceLine.clear();
                }

              
                cfSourceLine.add(flows);

                scope.linechartData = d3.nest().key(function(d){return d.reporting_id}).entries(cfSourceLine.year().top(Infinity))
                

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

          var update = function(){
            chart.datum(timelineData).call(stacked)
          }

        //init()
        scope.$watch("entities.sourceEntity.selected", function(newValue, oldValue){
          if(newValue != oldValue && newValue){
              init(newValue.RICid)
          }
        })

        scope.$watch("reporting", function(newValue, oldValue){
          if(newValue != oldValue && newValue){
              var partnerID = scope.entities.sourceEntity.selected.RICid;
              initLinechart(newValue, partnerID, scope.startDate, scope.endDate)
          }
        }, true)

        scope.$watch("filter", function(newValue, oldValue){
          if(newValue != oldValue){
              if(newValue == "all"){
                cfSource.type().filterAll()
                scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})
              }else{
                cfSource.type().filterExact(newValue)
                scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})
              }
          }
        })

      }
    }
  }])
  .directive('barchartCountry',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

          var doubleBar = ricardo.doubleBarChart()
            .width(element.width())


          var chart = d3.select(element[0])

        scope.$watch("barchartData", function(newValue, oldValue){
          if(newValue != oldValue){
            chart.datum(newValue).call(doubleBar.RICentities(scope.RICentities))
          }
        })

        scope.$watch("order", function(newValue, oldValue){
          if(newValue != oldValue){
            chart.call(doubleBar.order(newValue))
          }
        })

      }
    }
  }])
  .directive('stackedTimelineWorld',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

        var timelineData;

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

            scope.tableData = cfSource.year().top(Infinity)
            scope.linechartData = d3.nest().key(function(d){return d.reporting_id}).entries(cfSource.year().top(Infinity))
            
            if(!scope.$$phase) {
              scope.$apply()
            }
          })

        var chart = d3.select(element[0])

                
        
        var init = function(sourceID){
          var ids = sourceID.map(function(d){return d.RICid})
          apiService
            .getFlows({reporting_ids:ids.join(","), partner_ids: 442})
            .then(
              function(data){
                
                var flows = data.flows;

                if(!flows.length){
                  alert("no data")
                  console.log("no data")
                  return
                }

                if(cfSource.size()>0){
                  cfSource.year().filterAll()
                  cfSource.clear();
                }

                scope.RICentities = {}

                data.RICentities.partners.forEach(function(d){
                  scope.RICentities[""+d.RICid] = {RICname : d.RICname, type: d.type}
                })

                flows.forEach(function(d){
                  d.type = scope.RICentities[""+d.partner_id].type
                })
              
                cfSource.add(flows);

                scope.startDate = cfSource.year().bottom(1)[0].year
                scope.endDate = cfSource.year().top(1)[0].year
                
                scope.tableData = cfSource.year().top(Infinity)

                scope.linechartData = d3.nest().key(function(d){return d.reporting_id}).entries(cfSource.year().top(Infinity))
                
                var flowsPerYear = cfSource.years().top(Infinity)

                timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
                
                flowsPerYear.sort(function(a, b){ return d3.ascending(a.key, b.key); })
                flowsPerYear.forEach(function(d){
                    timelineData[0].values.push({total: d.value.imp, year: d.key})
                    timelineData[1].values.push({total: d.value.exp, year: d.key})
                })

                update()

                d3.select('.timeline-cont').classed("timeline-open", true)
                d3.select('.table-cont').classed("table-cont-open", true)

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

          var update = function(){
            chart.datum(timelineData).call(stacked)
          }

        scope.$watch("reporting", function(newValue, oldValue){
          if(newValue != oldValue && newValue){
              init(newValue)
          }
        }, true)

        // scope.$watch("filter", function(newValue, oldValue){
        //   if(newValue != oldValue){
        //       if(newValue == "all"){
        //         cfSource.type().filterAll()
        //         scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})
        //       }else{
        //         cfSource.type().filterExact(newValue)
        //         scope.barchartData = cfSource.partners().top(Infinity).filter(function(d){return d.key != 442})
        //       }
        //   }
        // })

      }
    }
  }])
  .directive('linechartWorld',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

          var linechart = ricardo.linechart()
            .width(element.width())


          var chart = d3.select(element[0])

        scope.$watch("linechartData", function(newValue, oldValue){
          if(newValue != oldValue){
            var reportingId = scope.reporting.map(function(d){return ""+d.RICid})
            var colors = []
            var repNumber = d3.range(reportingId.length)
            repNumber.forEach(function(d){
              var color = scope.lineColors[d]
              colors.push(color)
            })
            chart.datum(newValue).call(linechart.lineColors(colors).sort(reportingId))
          }
        })

        scope.$watch("yValue", function(newValue, oldValue){
          if(newValue != oldValue){
            chart.call(linechart.yValue(newValue))
          }
        })

      }
    }
  }])
  .directive('listWorld',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: "partials/listworld.html"
    }
  }])