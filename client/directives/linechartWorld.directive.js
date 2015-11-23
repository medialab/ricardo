'use strict';

/* Directives */

angular.module('ricardo.directives.linechartWorld', [])

 // /* directive with only watch */
  .directive('linechartWorld',[ 'fileService', 'apiService', '$timeout',function (fileService, apiService, $timeout){
    return {
      restrict: 'E',
      template: '<div id="linechart-world-container"></div>',
      scope: {
        ngData: '='
      },
      link: function(scope, element, attrs) {

        function noData(entity) {
          d3.select("#linechart-world-container").append("div")
            .attr("class", "alert")
            .attr("id", "missingDataLineChart")
            .html(function() {
               return '<div class="modal-body" ><p> There is <strong>no data available</strong> in the database for '+ entity + '</p><p>Choose another one or change date selection, thank you !</p> </div> <div class="modal-footer"><button class="btn btn-default" ng-click="okPartner()">OK</button></div>';})
            .on("click", function(){
              chart.selectAll("div#missingDataLineChart").remove();
            })
        }

        var chart = d3.select(element[0])

        scope.$watch("ngData", function(newValue, oldValue){

          if(newValue && newValue !== oldValue && newValue.length > 0){     

            newValue.forEach(function (e) {
              if (e.color === undefined)
                e.color=scope.reporting.filter(function(r){return r.RICid===e.key})[0]["color"]
            })
             
            var yValueSterling;
            var yValueSelect;

            if (newValue.flowType)
              yValueSelect = newValue.flowType
            else
              yValueSelect = newValue[0].type ? newValue[0].type : newValue[0].flowType;           

            // var missing;
            // var allExpNull = newValue[0].values.every(function (d) {return d.exp === null ;})
            // var allImpNull = newValue[0].values.every(function (d) {return d.imp === null ;})

            for (var i = 0, len = newValue.length; i < len ; i++)
            {
              var allExpNull = newValue[0].values.every(function (d) {return d.exp === null ;})
              var allImpNull = newValue[0].values.every(function (d) {return d.imp === null ;})
            }
            if (allExpNull && allImpNull)
              noData(newValue[i].values[0].reporting_id)
            
            linechart(newValue, yValueSelect);
          }
        })

        var height = 400,
            width = document.querySelector('#linechart-world-container').offsetWidth,
            sort = [],
            yValue = 'total',
            duration = 500;

        var selection = d3.select("#linechart-world-container");

        function linechart(data, yValue){
          var chart;
          var margin = {top: 20, right: 0, bottom: 30, left: 0},
              chartWidth = width - margin.left - margin.right,
              chartHeight = height - margin.top - margin.bottom;

          if (selection.select('svg').empty()){
            chart = selection.append('svg')
            .attr('width', width)
            .attr('height', height)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          }
          else
          {
            chart = selection.select('svg')
            .attr('width', width)
            .attr('height', height)
              .select("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          }

          var x = d3.time.scale()
              .range([0, chartWidth]);

          var y = d3.scale.linear()
              .range([chartHeight, 0]);

          // var colorDomain = sort;

          var yMax = d3.max(data, function(elm) {return d3.max(elm.values, function(d) { return d[yValue]; }); });
          var xMax = d3.max(data, function(elm) {return d3.max(elm.values, function(d) { return new Date(d.year, 0, 1) }); });
          var xMin = d3.min(data, function(elm) {return d3.min(elm.values, function(d) { return new Date(d.year, 0, 1) }); });

          x.domain([xMin,xMax])
          y.domain([0,yMax])

         /* axis */

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(5)
              .tickSize(width)
              //.tickFormat(d3.format("s"))
              .tickFormat(function(d,i){
                var prefix = d3.formatPrefix(d)
                if(i == 0){
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

          var gy = chart.select("g.y.axis"),
              gx = chart.select("g.x.axis");


          if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty() && data){

            gx = chart.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + chartHeight + ")")
              .call(xAxis);

            gy = chart.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);
                
            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);
            }
            else {

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

         /* lines */

          var line = d3.svg.line()
              .defined(function(d) {return d[yValue]; })
              .x(function(d) { return x(new Date(d.year, 0, 1)); })
              .y(function(d) { return y(d[yValue]); });

          var entities = chart.selectAll(".line")
              .data(data, function(d){return d.key});

          var enter = entities.enter()
                .append("path")
                  .attr("class", "line")
                  .attr("stroke", function(d,i) { return d["color"]; })
                  .attr("fill", "none")
                  .attr("stroke-width", "2px")
            
          entities
            .attr("d", function(d) { return line(d.values); })
            .attr("stroke", function(d,i) { return d["color"]; })
            .attr("fill", "none")

          entities.exit().remove()

          var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
          
          var voronoiGroup = chart.select(".voronoi")

          if(voronoiGroup.empty()){
            voronoiGroup = chart.append("g")
                        .attr("class", "voronoi")
                        .attr("fill", "none")
                        .attr("pointer-events", "all")
          }

          var voronoiGraph = voronoiGroup.selectAll("path")
            .data(voronoi(d3.merge(data.map(function(d) { return d.values.filter(function(d){return d[yValue]}); }))))
              
          voronoiGraph
            .attr("d", function(d) { if(d!==undefined) return "M" + d.join("L") + "Z"; })
            .datum(function(d) { if(d!==undefined) return d.point; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);


          voronoiGraph
            .enter().append("path")
            .attr("d", function(d) { 
              if (d !== null) return "M" + d.join("L") + "Z"; })
            .datum(function(d) {return d.point ; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

          voronoiGraph.exit().remove()

          var focus = chart.select(".focus")
                    
          if(focus.empty()){
            focus = chart.append("g")
                .attr("transform", "translate(-100,-100)")
                .attr("class", "focus");
            }

          focus.append("circle")
            .attr("r", 3);

          focus.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")

          var format = d3.format("0,000");

          function colorLine(country) {
            var color;
            data.forEach(function (d) {
              if (d.key === country)
                color = d.color;
            })
            return color;
          }

          function mouseover(d) {
            if (d !== undefined) {
              if(d[yValue]!==null && d[yValue]!==undefined)
              {
                var colorPoint = colorLine(d.reporting_id);
                focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                if (d.value)
                  focus.select("text").attr("fill", colorPoint).text(d3.round(d[yValue], 2) + ' %');
                else
                  focus.select("text").attr("fill", colorPoint).text(format(Math.round(d[yValue])) + ' £');

                chart.append("line")
                       .attr("class", "lineDate")
                       .attr("x1", x(new Date(d.year, 0, 1)))
                       .attr("y1", y(d[yValue]))
                       .attr("x2", x(new Date(d.year, 0, 1)))
                       .attr("y2", 350)
                       .attr("stroke-width", 1)
                       .attr("stroke", "grey");
               var text = chart.append("text")
                       .attr("class", "lineDate")
                       .attr("x", x(new Date(d.year, 0, 1)) - 15)
                       .attr("y", 368)
                       .attr("font-size", "0.85em")
                       .text(d.year);

                // Define the gradient
                  var gradient = chart.append("chart:defs")
                      .append("chart:linearGradient")
                      .attr("id", "gradient")
                      .attr("x1", "0%")
                      .attr("y1", "100%")
                      .attr("x2", "100%")
                      .attr("y2", "100%")
                      .attr("spreadMethod", "pad");

                  // Define the gradient colors
                  gradient.append("chart:stop")
                      .attr("offset", "0%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 0.1);

                  gradient.append("chart:stop")
                      .attr("offset", "50%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 1);

                  gradient.append("chart:stop")
                      .attr("offset", "100%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 0.1);

                  // add rect as background to hide date display in 
                  var bbox = text.node().getBBox();
                  var rect = chart.append("chart:rect")
                      .attr("class", "lineDateText")
                      .attr("x", bbox.x - 50)
                      .attr("y", bbox.y)
                      .attr("width", bbox.width + 100)
                      .attr("height", bbox.height)
                      .style("fill", 'url(#gradient)')


                  // add date
                  var textDate = chart.append("text")
                       .attr("class", "lineDateText")
                       .attr("x", x(new Date(d.year, 0, 1)) - 15)
                       .attr("y", 368)
                       .attr("font-size", "0.85em")
                       .text(d.year);
              }
              
            }
          }

          function mouseout(d) {
            chart.selectAll("line.lineDate").remove();
            chart.selectAll("text.lineDate").remove();
            chart.selectAll("text.lineDateText").remove();
            chart.selectAll("rect.lineDateText").remove();
            focus.attr("transform", "translate(-100,-100)");
          }     
        } // end linechart
      }
    }
  }])