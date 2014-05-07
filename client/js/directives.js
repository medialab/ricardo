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
      //templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

        var timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
        
        function init(){
          
          apiService
            .getFlows('data/bilateral_france_UK.json')
            .then(
              function(data){
                var flows = data.flows_in_pounds,
                    mirror_flows = data.mirror_flows;
                
                cfSource.add(flows);
                cfTarget.add(mirror_flows);

                scope.testData = flows
                
                scope.streamData = [
                  {key:"first", values:[
                    {y: cfSource.imp(), x:0, key:"first"},
                    {y: cfTarget.exp(), x:1, key:"first"}
                    ]
                  },
                  {key:"second", values:[
                    {y: cfSource.exp(), x:0, key:"second"},
                    {y: cfTarget.imp(), x:1, key:"second"}
                    ]
                  }
                ]

                flows.forEach(function(d){
                  timelineData[0].values.push({total: d.imp, year: new Date(d.year, 0, 1)})
                  timelineData[1].values.push({total: d.exp, year: new Date(d.year, 0, 1)})
                })
                
                var stacked = ricardo.stackedBar()
                  .width(element.width())
                  .height(200)
                  .stackColors(["#FF4136","#3D9970"])
                  .on("brushed", function(d){
                    cfSource.year().filterRange(d)
                    cfTarget.year().filterRange(d)
                  })

                var chart = d3.select(element[0])

                chart.datum(timelineData).call(stacked)

              },
              function(error) {
                console.log(error)
              }
            )
  
          }

        scope.$watch("sourceEntity.selected", function(newValue, oldValue){
          if(newValue != oldValue){
            init()
          }
        })

      }
    }
  }])
  .directive('stream',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      //templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {
        
        function init(data){

          console.log(data)

          var stream = ricardo.stream()
            .width(element.width())
            .height(200)
            .stackColors(["#FF4136","#3D9970"])

          var chart = d3.select(element[0])

          chart.datum(data).call(stream)

        }


        scope.$watch("streamData", function(newValue, oldValue){
          if(newValue != oldValue){
            init(newValue)
          }
        })

      }
    }
  }])
