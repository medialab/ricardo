'use strict';

/* Directives */

angular.module('ricardo.directives.reportingContinent', [])

  /* directive with watch, update and draw functions */
  .directive('reportingContinent', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-continent-container"></div>',
      scope: {
        ngData: '=',
        startDate: '=',
        endDate: '=',
        flowType: "=",
        layout: "="
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue && scope.ngData){
            	draw(newValue);
            }
        });

        scope.$watchCollection('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('flowType', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            yValue=newValue.type.value;
            yName=newValue.name.value;
            draw(scope.ngData);
          }
        })

        scope.$watch('layout', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            layout=newValue.type.value;
            draw(scope.ngData);
          }
        })

        var continentColors = {
                    "Europe":"#bf6969",
                     "Asia":"#bfbf69" ,
                     "Africa":"#69bfbf",
                     "America":"#69bf69",
                     "World":"#bf69bf",
                     "Oceania":"#6969bf"
                    }

        function colorByContinent(continent) {
          return continentColors[continent]
        }

        var margin = {top: 20, right: 0, bottom: 40, left: 0},
            width = document.querySelector('#reporting-continent-container').offsetWidth-margin.left-margin.right,
            height=400;

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var layout=scope.layout.type.value;

        var color = d3.scale.category10();

        var x = d3.time.scale()
                  .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("right")
                      .ticks(4)
                      .tickSize(0)
                      .tickFormat(function(d,i){
                        if(d === 0 || d===25000) return "";
                      });

        var svg = d3.select("#reporting-continent-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var stack = d3.layout.stack()
                    .offset(layout)
                    .values(function(d) { return d.values; })
                    .x(function(d) { return x(new Date(d.year,0,1)); })
                    .y(function(d) { return d.values[yValue]; })
                    // .order("reverse"); //if log scale

        var area = d3.svg.area()
                    // .interpolate("linear")
                    .x(function(d) { return x(new Date(d.year,0,1));})
                    // .y0(function(d) { return y(d.y0); })
                    // .y1(function(d) { return y(d.y0 + d.y); });

        var voronoi = d3.geom.voronoi()
                .x(function(d) { return x(new Date(d.year,0,1)); })
                .y(function(d) { return y(d.y0+d.y/2); })
                // .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
                .clipExtent([[0,0],[width,height]])

        //tooltips
        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "continent-tooltip");

        function draw(data) {

          x.domain([new Date(scope.startDate,0,1), new Date(scope.endDate,0,1)]);

          var dataFiltered=data.filter(function(d){
            return d.year>=x.domain()[0].getFullYear() && d.year<= x.domain()[1].getFullYear();
          })

          var nested=d3.nest()
                    .key(function(d) { return d.continent; })
                    .entries(data)

          //compute ymax for mutliples
          nested.forEach(function(n) {
            var nestedFiltered=n.values.filter(function(d){
              return d.year>=x.domain()[0].getFullYear() && d.year<= x.domain()[1].getFullYear();
            })
            n.maxFlow = d3.max(nestedFiltered, function(d) { return d.values[yValue]; });
          });

          if(layout==="multiple"){

            y.range([height/6, 0]);
            //relayout area
            area.y0(height/6)
                .y1(function(d) { return y(d.values[yValue]); });

            if (svg.select('g').empty()){
                  var multi_g=svg.selectAll(".multiple")
                      .data(nested)
                      .enter().append("g")
                      .attr("height", height/6 + margin.top + margin.bottom)
                      .attr("width", width)
                      .attr("transform", function(d, i) { return "translate(0," + ((5-i) * height/6) + ")"; })
                      .attr("class", "multiple")

                  multi_g.each(function(d) {
                     var e = d3.select(this);
                     e.append("path")
                          .attr("class", "area")
                          .attr("d", function(d) { y.domain([0, d.maxFlow]); return area(d.values); })
                          .style("fill", function(d) { return continentColors[d.key]; })
                      // .on("mouseover", function(d, i) {
                      //   svg.selectAll(".layer").transition()
                      //   .duration(250)
                      //   .attr("opacity", function(d, j) {
                      //     return j != i ? 0.3 : 1;
                      // })})
                      // .on("mouseout", function(d, i) {
                      //    svg.selectAll(".layer")
                      //     .transition()
                      //     .duration(250)
                      //     .attr("opacity", "1");})
                      e.append("text")
                        .text(function(d){ return d.key})
                        .attr("text-anchor","start")
                        .attr("x",0)
                        .attr("y",height/12)
                        .attr("font-size",15)
                      e.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0,"+height/6+")")
                            .call(xAxis);

                      e.append("g")
                            .attr("class", "y axis")
                            .call(yAxis)
                  })
                }
            //y domain not updated
            else{
                  svg.selectAll(".multiple")
                      .data(nested)
                      .transition().duration(500)
                      .attr("transform", function(d, i) { return "translate(0," + ((5-i) * height/6) + ")"; })
                  svg.selectAll(".area")
                      .transition().duration(500)
                      .attr("d", function(d) { y.domain([0, d.maxFlow]); return area(d.values); })

                  svg.selectAll(".x.axis,.y.axis")
                      .transition().duration(500)
                      .style("opacity",0)
                  svg.selectAll(".multiple").selectAll(".x.axis")
                      .transition().duration(500)
                      .style("opacity",1)
                      .call(xAxis);
                  svg.selectAll(".multiple").selectAll(".y.axis")
                      .transition().duration(500)
                      .style("opacity",1)
                      .call(yAxis);
                  svg.selectAll(".multiple").selectAll("text")
                      .transition().duration(500)
                      .style("opacity",1)

                  // svg.selectAll(".x.axis,.y.axis")
                  //     // .transition().duration(500)
                  //     .style("opacity",0)

                  // svg.selectAll(".multiple")
                  //     .transition().duration(500)
                  //     .attr("transform", function(d, i) { return "translate(0," + ((5-i) * height/6) + ")"; })
                  //     .each(function(d) {
                  //        var e = d3.select(this);
                  //        e.select(".area")
                  //             .attr("d", function(d) { y.domain([0, d.maxFlow]); return area(d.values); })
                  //        y.range([height/6, 0]).domain([0, d.maxFlow]);
                  //        e.select(".y.axis").style("opacity",1).call(yAxis)
                  //        e.select(".x.axis").style("opacity",1).call(xAxis)
                  //   })
                }
          }
          if(layout==="zero" || layout==="expand"){

            //update layout stacked area
            stack.offset(layout);
            var layers=stack(nested);

            y.range([height, 0])
             .domain([0,d3.max(dataFiltered,function(d){
                return d.y0 + d.y;
            })])

            area.y0(function(d) { return y(d.y0); })
            .y1(function(d) { return y(d.y0 + d.y); });

              // y.domain([0, d3.max(layers,function(d){
              //   return  d3.max(d.values,function(v){
              //     return v.y0+v.y;
              //   })
              // })])

            if (svg.select('g').empty()){
              var multi_g=svg.selectAll(".multiple")
                      .data(layers)
                      .enter().append("g")
                      .attr("class", "multiple")

              multi_g.each(function(d) {
                 var e = d3.select(this);
                 e.append("path")
                      .attr("class", "area")
                      .attr("d", function(d) { return area(d.values); })
                      .style("fill", function(d) { return continentColors[d.key]; })

              })
              // var layer_g=svg.append('g')
              //              .attr("class", "layers")
              // layer_g.selectAll(".layer")
              //   .data(layers)
              //   .enter().append("path")
              //   .attr("class", "layer")
              //   .attr("d", function(d) { return area(d.values); })
              //   .style("fill", function(d) { return continentColors[d.key]; })
              //   .style("stroke", "#f5f5f5")
              //   .attr("opacity", 1)
              //   // .on("mouseover", function(d, i) {
              //   //   svg.selectAll(".layer").transition()
              //   //   .duration(250)
              //   //   .attr("opacity", function(d, j) {
              //   //     return j != i ? 0.3 : 1;
              //   // })})
              //   // .on("mouseout", function(d, i) {
              //   //    svg.selectAll(".layer")
              //   //     .transition()
              //   //     .duration(250)
              //   //     .attr("opacity", "1");})
              svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0,"+height+")")
                .call(xAxis);

              svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
            }
            else{
                  svg.selectAll(".multiple")
                      .data(layers)
                      .transition().duration(500)
                      .attr("transform", "translate(0,0)")
                  svg.selectAll(".area")
                  .transition().duration(500)
                      .attr("d", function(d) { return area(d.values); })
                  svg.selectAll(".multiple").selectAll(".x.axis, .y.axis,text")
                      .style("opacity",0)
                  // svg.selectAll(".x.axis")
                  //     .transition().duration(500)
                  //     .style("opacity",1)
                  //     .call(xAxis);
                  // svg.selectAll(".y.axis")
                  //     .transition().duration(500)
                  //     .style("opacity",1)
                  //     .call(yAxis);
                }

              /*
               * Voronoi
               */

              svg.select(".voronoi").remove();

              // if(voronoiGroup.empty()){
              var voronoiGroup = svg.append("g")
                            .attr("class", "voronoi")
                            .attr("fill", "none")
                            .attr("pointer-events", "all")
              // }

              var voronoiGraph = voronoiGroup.selectAll("path")
                .data(voronoi(dataFiltered))


              voronoiGraph
                .enter().append("path")
                // .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
                // .datum(function(d, i) { return d.point; })
                .attr("d", function(d) {
                  if (d !== undefined) return "M" + d.join("L") + "Z"; })
                .datum(function(d) { if (d !== undefined) return d.point ; })
                // .style("stroke", "#2074A0") //I use this to look at how the cells are dispersed as a check
                // .style("stroke-opacity", 0.5)
                // .style("fill", "none")
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on('mousemove', function(d) {
                    tooltip.style("opacity", .9)
                    // var wid = tooltip.style("width").replace("px", "");
                    .style("left", (Math.min(window.innerWidth,
                        Math.max(0, (d3.event.pageX)))-75) + "px")
                    .style("top", (d3.event.pageY + 75) + "px")
                    .style("width", "150px");
                      // .style("width", wid + "px");
                });
            }//if stacked layout

          }//end draw function
          function mouseover(d){
            if(d!==undefined && d.y!==0){

              svg.append("line")
               .attr("class", "yearFlow")
               .attr("x1", x(new Date(d.year,0,1)))
               .attr("y1", y(d.y0))
               .attr("x2", x(new Date(d.year,0,1)))
               .attr("y2", y(d.y+d.y0))
               .attr("stroke-width", 1)
               .attr("stroke", "black");

              svg.selectAll(".area").transition()
                .duration(250)
                .style("stroke",function(e){
                  return e.key != d.continent ? "#f5f5f5" : "black";
                })
                .style("stroke-width",function(e){
                  return e.key != d.continent ? "0" : "2px";
                })
                .style("opacity", function(e) {
                  return e.key != d.continent ? 0.3 : 1;
                })
              tooltip.html(
                "<h5>"+ d.continent + " in " + d.year + "</h5>" +
                "<p>"+yName+": " + d.values[yValue] + "</p>"+
                "<p>Percent: " + d.y + "</p>"
              ).transition().style("opacity", .9);
            }
          }
          function mouseout(d){
            svg.selectAll(".yearFlow").remove();
            svg.selectAll(".area")
              .transition()
              .duration(250)
              .style("stroke","#f5f5f5")
              .style("stroke-width","1px")
              .style("opacity", "1")

            tooltip.transition().style("opacity", 0);
          }

      }
    }
  }])