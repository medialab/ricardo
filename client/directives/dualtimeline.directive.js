'use strict';

/* Directives */

angular.module('ricardo.directives.dualTimeline', [])

  /* directive with watch, update and draw functions */
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
          console.log("DT")
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          console.log("DT end")
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          console.log("DT start")
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        var x
          , y
          , xAxis
          , yAxis
          , areaImp
          , areaExp
          , lineImp
          , lineExp

        function draw(data){
          document.querySelector('#dual-timeline-container').innerHTML = null;

          var margin = {top: 10, right: 0, bottom: 30, left: 0},
              width = document.querySelector('#dual-timeline-container').offsetWidth - margin.left - margin.right,
              height = 180 - margin.top - margin.bottom;

          /*
           * Config axis
           */
          x = d3.time.scale()
              .range([0, width]);

          y = d3.scale.linear()
              .range([height, 0]);

          xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(4)
              .tickSize(width)
              .tickFormat(function(d,i){
                var prefix = d3.formatPrefix(d)
                if(i === 0){
                  return
                }
                else{
                  var symbol;
                  if(prefix.symbol === "G"){
                    symbol = "billion"
                  }else if(prefix.symbol === "M"){
                    symbol = "million"
                  }else if(prefix.symbol === "k"){
                    symbol = "thousand"
                  }else{
                    symbol = ""
                  }
                  return prefix.scale(d) + " " + symbol
                }
              })

           x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
           y.domain([0, d3.max( data.filter(function(d){ return d.year >= scope.startDate
            && d.year <= scope.endDate}), function(d) { return Math.max( d.imp, d.exp ); })]);

          /*
           * Draw areas & lines
           */

          areaImp = d3.svg.area()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.imp); });

          lineImp = d3.svg.line()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.imp); });

          areaExp = d3.svg.area()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) {
                if (d.exp !== null)
                  return y(d.exp);
              });

          lineExp = d3.svg.line()
              .defined(function(d) { return d.exp !== null; })
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

          svg.select(".x.axis")
              .transition().duration(750)
              .call(xAxis);

          svg.select(".y.axis")
              .transition().duration(750)
              .call(yAxis);

          svg.append("path")
              .datum(data)
              .attr("class", "area-imp")
              .attr("d", areaImp);

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

          /*
           * Add axis to svg
           */
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

          /*
           * Select only imp & exp data from country selected
           */
          var ImpExp = [];
          data.forEach(function (data) {
            if (data.year >= scope.startDate && data.year <= scope.endDate) {
              ImpExp.push({type:"imp", points: data.imp, year: data.year});
              ImpExp.push({type:"exp", points: data.exp, year: data.year});
            }
          })

          voronoi(ImpExp, "points", svg, margin, height, width);

        }
          /*
           * Voronoi fonction
           */

          function voronoi(data, yValue, svg, margin, height, width) {
            var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

            var voronoiGroup = svg.select(".voronoi")

            if(voronoiGroup.empty()){
                  voronoiGroup = svg.append("g")
                              .attr("class", "voronoi")
                              .attr("fill", "none")
                              .attr("pointer-events", "all")
            }

            var voronoiGraph = voronoiGroup.selectAll("path")
                .data(voronoi(data.filter(function(d){ return d[yValue] !== null})))

            voronoiGraph
                  .enter().append("path")
                  .attr("d", function(data) { return "M" + data.join("L") + "Z"; })
                  .datum(function(d) { return d.point; })
                  .on("mouseover", mouseover)
                  .on("mouseout", mouseout);

            voronoiGraph.exit().remove()

            var focus = svg.select(".focus")

            if(focus.empty()){
                focus = svg.append("g")
                    .attr("transform", "translate(-100,-100)")
                    .attr("class", "focus")

                  }

            focus.append("circle")
                .attr("r", 3)

            focus.append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")

            var format = d3.format("0,000");

            function mouseover(d) {
              if(d[yValue]!=null)
              {
                var colorPoint = d.type === "imp" ? "#CC6666" : "#663333"

                focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                focus.select("text")
                  .attr("fill", colorPoint)
                  .text(format(Math.round(d[yValue])) + ' £');

                /*
                 * Vertical line
                 */
                svg.append("line")
                     .attr("class", "lineDate")
                     .attr("x1", x(new Date(d.year, 0, 1)))
                     .attr("y1", y(d[yValue]))
                     .attr("x2", x(new Date(d.year, 0, 1)))
                     .attr("y2", 142)
                     .attr("stroke-width", 1)
                     .attr("stroke", "grey");

                /*
                 * Add date
                 */
                var text = svg.append("text")
                     .attr("class", "lineDateText")
                     .attr("x", x(new Date(d.year, 0, 1)) - 15)
                     .attr("y", 157)
                     .attr("font-size", "0.85em")
                     .text(d.year);

                /*
                 *  Define the gradient
                 */
                var gradient = svg.append("svg:defs")
                    .append("svg:linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                /*
                 *  Define the gradient colors
                 */
                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 0.1);

                gradient.append("svg:stop")
                    .attr("offset", "50%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 1);

                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 0.1);

                /*
                 *  Add rect as background to hide date display in
                 */
                var bbox = text.node().getBBox();
                var rect = svg.append("svg:rect")
                    .attr("class", "lineDateText")
                    .attr("x", bbox.x - 50)
                    .attr("y", bbox.y)
                    .attr("width", bbox.width + 100)
                    .attr("height", bbox.height)
                    .style("fill", 'url(#gradient)')


                /*
                 * Add date
                 */
                var textDate = svg.append("text")
                     .attr("class", "lineDateText")
                     .attr("x", x(new Date(d.year, 0, 1)) - 15)
                     .attr("y", 157)
                     .attr("font-size", "0.85em")
                     .text(d.year);
              }
            }

          function mouseout(d) {
              svg.selectAll("line.lineDate").remove();
              svg.selectAll("text.lineDateText").remove();
              svg.selectAll("rect.lineDateText").remove();
              focus.attr("transform", "translate(-100,-100)");
          }
        }
      }
    }
  }])