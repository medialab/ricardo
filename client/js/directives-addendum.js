'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])

  .directive('bilateralTitle', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/bilateralTitle.html'
    }
  }])

  .directive('countryTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/countryTitle.html'
    }
  }])

  .directive('dualTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="dual-timeline-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        function draw(data){
          document.querySelector('#dual-timeline-container').innerHTML = null;

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
              .defined(function(d) { return d.imp != null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.imp); });

          var lineImp = d3.svg.line()
              .defined(function(d) { return d.imp != null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.imp); });

          var areaExp = d3.svg.area()
              .defined(function(d) { return d.exp != null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.exp); });

          var lineExp = d3.svg.area()
              .defined(function(d) { return d.exp != null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.exp); });

          var svg = d3.select("#dual-timeline-container").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          data.forEach(function(d){
            d.date = new Date(d.year, 0, 1)
          })

          // x.domain(d3.extentd3.extent( data, function(d) { return d.date; }));
          x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
          y.domain([0, d3.max( data, function(d) { return Math.max( d.imp, d.exp ); })]);

          svg.append("path")
              .datum(data)
              .attr("class", "area-imp")
              .attr("d", areaImp)

          svg.append("path")
              .datum(data)
              .attr("class", "line-imp")
              .attr("d", lineImp)
          
          svg.append("path")
              .datum(data)
              .attr("class", "area-exp")
              .attr("d", areaExp)

          svg.append("path")
              .datum(data)
              .attr("class", "line-exp")
              .attr("d", lineExp)

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
      }
    }
  }])

  .directive('brushingTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="brushing-timeline-container"></div>'
    }
  }])

  .directive('chartOfMissing', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="chart-of-missing-container"></div>'
    }
  }])

  .directive('inlineSelectCountry', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectCountry.html'
      ,scope: {
        model: '=ngModel'
        ,list: '=list'
      }
    }
  }])

  .directive('inlineSelectYear', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectYear.html'
      ,scope: {
        model: '=ngModel'
        ,list: '=list'
      }
    }
  }])
