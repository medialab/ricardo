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
  .directive('stackedTimeline',[ 'cf', 'fileService', '$timeout', function (cf, fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      //templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

        var timelineData;
        
        function init(){
        
          fileService
            .getFile('data/ricardo_basic_14janv.csv')
            .then(
              function(data){
              var list = d3.csv.parse(
                              data, 
                              function(d) {
                                return {
                                  entity: d.entity,
                                  partner: d.partner,
                                  currency: d.currency,
                                  exp_imp: d["exp/imp"],
                                  year: new Date(+d.year, 0, 1),
                                  flow: +d.flow,
                                  total_pounds: +d.total_pounds,
                                }
                              })

              scope.testData = list.filter(function(d){return d.entity == "France"})
              cf.add(scope.testData)
              cf.partner().filter("Italy")
              timelineData = d3.nest().key(function(d){return d.exp_imp}).entries(cf.year().top(Infinity))
              
              var stacked = ricardo.stackedBar()
                .width(element.width())
                .height(200)
                .stackColors(["#FF4136","#3D9970"])
                .on("brushed", function(d){
                  console.log(d)
                })

              var chart = d3.select(element[0])

              chart.datum(timelineData).call(stacked)

              },
              function(error) {
                console.log(error)
              }
            )
          }

        scope.$watch("country.selected", function(newValue, oldValue){
          if(newValue != oldValue){
            init()
          }
        })

      }
    }
  }])
