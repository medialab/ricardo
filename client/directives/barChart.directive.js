'use strict';

/* Directives */

angular.module('ricardo.directives.barChart', [])

  /* directive with watch, update and draw functions */
  .directive('barChart', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="bar-chart-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
              barChart(scope.ngData, scope.startDate, scope.endDate);
          }
        });

        var tooltipBar = d3.select("body")
          .append("div")
          .attr("class", "circle-tooltip");

        var brush

        function barChart(data, start, end) {
            
            var margin = {top: 20, right: 0, bottom: 40, left: 0},
                width = document.querySelector('#dual-timeline-container').offsetWidth,
                height = 60;
            
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
                .ticks(4)
                .tickSize(0);

            var svg = d3.select("#bar-chart-container").append("svg")
                .attr("width", width )
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([new Date(start, 0, 1), new Date(end, 0, 1)]);
            y.domain([0, d3.max(data, function(d) { return d.nb_reporting; })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);

              function customAxis(g) {
                g.selectAll("text")
                  .attr("x", 4)
                  .attr("dy", -4)
                  .attr("font-size", "0.85em");
                }

              var expNbReportings = data.filter(function (d) { return d.type === "Exp"});
              var impNbReportings = data.filter(function (d) { return d.type === "Imp"});
              
              var endStart = (end-start);
              var barWidth = Math.floor(width / endStart);


              svg.selectAll(".bar")
                  .data(impNbReportings)
                .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d) { return x(new Date(d.year, 0, 1)) })
                  .attr("width", barWidth)
                  .attr("y", function(d) { return y(d.nb_reporting); })
                  .attr("height", function(d) { return height - y(d.nb_reporting); })
                  .style({fill: "#cc6666"})
                  // .on('mouseover', function(d) {
                  // return tooltipBar.html(
                  //   "<p>Nb reportings : " + d.nb_reporting + "</p>"
                  //   ).transition().style("opacity", .9);
                  // })
                  // .on('mouseout', function(d) {
                  //   return tooltipBar.transition().style("opacity", 0);
                  // })
                  // .on('mousemove', function(d) {
                  //   tooltipBar.style("opacity", .9);
                  //   var wid = tooltipBar.style("width").replace("px", "");
                  //   return tooltipBar
                  //     .style("left", Math.min(window.innerWidth - wid - 20,
                  //       Math.max(0, (d3.event.pageX - wid/2))) + "px")
                  //     .style("top", (d3.event.pageY + 40) + "px")
                  //     .style("width", wid + "px");
                  // });

                  /* 50 line */
              svg.append("line")
                   .attr("x1", 0)
                   .attr("y1", y(50))
                   .attr("x2", width)
                   .attr("y2", y(50))
                   .attr("stroke-width", 1)
                   .attr("stroke", "grey");

                  /* 100 line */
              svg.append("line")
                   .attr("x1", 0)
                   .attr("y1", y(100))
                   .attr("x2", width)
                   .attr("y2", y(100))
                   .attr("stroke-width", 1)
                   .attr("stroke", "grey");
                   
            function type(d) {

              d.nb_reporting = +d.nb_reporting;
              return d;
            }

                      // Brush

          brush = d3.svg.brush()
            .x(x)
            .extent([new Date(scope.startDate), new Date(scope.endDate)])
            .on("brush", function(){
              if(brush.empty()){
                brush.clear()
                // dispatch.brushing(x.domain())
              }
              else{
                // dispatch.brushing(brush.extent())
              }
            })
            .on("brushend", brushended);

          function brushended() {
            if (!d3.event.sourceEvent) return; // only transition after input
            
            var extent0 = brush.extent(),
                extent1 = extent0.map(function(d){return d3.time.year(new Date(d))});

            d3.select(this).transition()
                .call(brush.extent(extent1))
                .call(brush.event);
            
            if(brush.empty()){
              brush.extent(x.domain())
              // dispatch.brushed(x.domain())
              // dispatch.brushing(x.domain())
            }
            else{
              // dispatch.brushed(brush.extent())
              // dispatch.brushing(brush.extent())
            }

            applyBrush()       
          }
          //selection.selectAll("g.brush").remove();
          var gBrush = svg.select(".brush");

          if(gBrush.empty()){
            gBrush = svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.event);

            gBrush.selectAll("rect")
                .attr("height", height);
          }else{
            gBrush
              .call(brush)
              .call(brush.event);
          }

          function applyBrush(){
            scope.startDate = (brush.extent()[0]).getFullYear()
            scope.endDate = (brush.extent()[1]).getFullYear()
            if(!scope.$$phase) {
              scope.$apply()
            }
          }


        }

        function updateBrush(){
          brush.extent([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)])
          if(scope.rawStartDate === scope.startDate && scope.rawEndDate === scope.endDate){
            brush.clear()
          }
          d3.select("#bar-chart-container svg").select(".brush").call(brush)
        }
      }
    }
         
  }])