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

        scope.$watch('endDate', function(newValue, oldValue) {
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

        var margin = {top: 20, right: 0, bottom: 40, left: 100 },
            width = document.querySelector('#reporting-continent-container').offsetWidth-margin.left-margin.right,
            height=400,
            offsetHeight=10;
        var bisector = d3.bisector(function(d) {return d.year;}).left;

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var layout=scope.layout.type.value;

        var color = d3.scale.category10();
        var format = d3.format("0,000");
        var duration=300;

        // var domain = [0, 1000,1000000,1000000000,10000000000,100000000000];

        var x = d3.time.scale()
                  .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10)

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("left")
                      .tickSize(-width)
                      .tickFormat(function(d,i){
                        if(i == 0){
                          return
                        }
                        else return valueFormat(d);
                      })
        function valueFormat(d){
          var prefix = d3.formatPrefix(d)
            var symbol;
            if(layout==="zero"||layout==="multiple"){
              if(prefix.symbol === "G"){
                symbol = "billion"
              }else if(prefix.symbol === "M"){
                symbol = "million"
              }else if(prefix.symbol === "k"){
                symbol = "thousand"
              }else{
                symbol = "";
              }
              return prefix.scale(d) + " " + symbol
            }else if(layout==="expand"){
              symbol = "%";
              return d*100+symbol;
            }
        }

        function customAxis(g) {
          g.selectAll("text")
            .attr("text-anchor","end")
            .attr("x", width)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }
        var svg = d3.select("#reporting-continent-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        var stack = d3.layout.stack()
                    .offset(layout)
                    .values(function(d) { return d.values; })
                    .x(function(d) { return x(new Date(d.year,0,1)); })
                    .y(function(d) { return d.values[yValue]; })
                    // .order("reverse"); //if log scale
        var line = d3.svg.line()
                    .defined(function(d) { return d.values[yValue]!==0; })
                    .x(function(d) { return x(new Date(d.year,0,1));})

        var area = d3.svg.area()
                    .defined(function(d) { return d.values[yValue]!==0; })
                    .x(function(d) { return x(new Date(d.year,0,1));})
                    // .y0(function(d) { return y(d.y0); })
                    // .y1(function(d) { return y(d.y0 + d.y); });

        var voronoi = d3.geom.voronoi()
                .x(function(d) { return x(new Date(d.year,0,1)); })
                .y(function(d) { return y(d.y0+d.y/2); })
                // .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
                .clipExtent([[0,0],[width,height]])

        var bisect = d3.bisector(function(d) { return d.date;}).left;

//////////////////////////////////////////////////////
////////////////// Tooltips Setup //////////////////
//////////////////////////////////////////////////////

        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "continent-tooltip")
                      .style("width", "200px")

        var tip_margin = {top: 20, right: 0, bottom: 10, left:0},
            tip_width = document.querySelector('.continent-tooltip').offsetWidth-tip_margin.left-tip_margin.right
            // tip_height= document.querySelector('.matrix-tooltip').offsetHeight-tip_margin.top-tip_margin.bottom
        tooltip.append("div").attr("class", "title");
        tooltip.append("div").attr("class","tip_svg")
        var svg_tip=tooltip.select(".tip_svg").append("svg")
                .attr("width",tip_width)
                .attr("height",20*5+tip_margin.top+tip_margin.bottom)
                .append("g")
                .attr("class","tip_group")
                .attr("transform", "translate(" + tip_margin.left + "," + tip_margin.top + ")");



        var x_tip=d3.scale.linear().range([0,tip_width-30])
        var y_tip=d3.scale.ordinal().rangeRoundBands([0,100])


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
            n.minFlow = d3.max(nestedFiltered, function(d) { if(d.values[yValue]!==0) return d.values[yValue]; });
          });

          //remove voronoi from the other two graph
          // svg.select(".voronoi").remove();
          //append background for mouse event
          if (svg.select('.background').empty()){
            svg.append("rect")
              .attr('class', 'background')
              .attr('width', width)
              .attr('height', height)
              .attr("fill","none")
              .style("pointer-events","all")
              .on("mouseover", function(d){
                tooltip.transition().style("opacity", .9);
              })
              .on("mousemove", function(){
                tooltip.style("opacity", .9)
                .style("left", d3.event.pageX+20 + "px")
                // .style("left", function(){
                //   if (d3.event.pageX-margin.left<width/2) return (d3.event.pageX+20)+ "px";
                //   else return (d3.event.pageX-220)+ "px"
                //   // var tooltip_position=(d3.event.pageX-margin.left)<width/2 ? (d3.event.pageX+20):(d3.event.pageX-220) + "px"
                //   // return tooltip_position
                // })
                // .style("top", (d3.event.pageY+75) + "px")
                .style("top", "400px")

                var mouse = d3.mouse(this),
                    mouseDate=x.invert(mouse[0]),
                    mouseYear = mouseDate.getFullYear(),
                    d0 = new Date(mouseYear,0,1),
                    d1 = new Date(mouseYear+1,0,1),
                    d = mouse - d0 > d1 - mouse ? d1 : d0;
                var selectData=data.filter(function(e){return e.year===d.getFullYear()})
                selectData.sort(function(a,b){return b.values[yValue]-a.values[yValue] })

                tooltip.select(".title").html(
                    "<h5>"+yName+" in "+d.getFullYear() +"</h5><hr>"
                )

                x_tip.domain([0,d3.max(selectData,function(d){return d.values[yValue]})])

                // y_tip.domain(v.exp_continent.map(function(d){return d.continent}))
                tooltip.select(".tip_group").selectAll("g").remove()
                var tip_partner=tooltip.select(".tip_group")
                       .selectAll(".tip_partner")
                       .data(selectData)
                       .enter().append("g")
                       .attr("class","tip_flow")
                       .attr("transform",function(d,i){
                          return "translate(0,"+2*i*(offsetHeight+2)+")"})
                tip_partner.append("rect")
                           .attr("width",function(d){return x_tip(d.values[yValue])})
                           .attr("height",10)
                           .attr("fill",function(d){return continentColors[d.continent]});
                tip_partner.append("text")
                           .text(function(d){return d.continent})
                           .attr("class","continentLabel")
                           .attr("y",-2)
                           .attr("fill","#fff")
                           .attr("font-size",11)
                tip_partner.append("text")
                           .text(function(d){
                              var value = layout==="expand" ? (d3.round(d.y*100,2)+" %"):(format(Math.round(d.values[yValue]))+" £");
                              return value;
                            })
                           .attr("x",function(d){return x_tip(d.values[yValue])+2})
                           .attr("y",9)
                           .attr("text-anchor",function(d,i){
                             return i===0 && d.values[yValue]!==0 ? "end":"start"
                           })
                           .attr("fill","#fff")
                           .attr("font-size",12)

                svg.selectAll(".baseline").selectAll("circle,line")
                    .filter(function(d){return d.values[yValue]!==0;})
                    .style("opacity", function(e) {
                      return e.year != d.getFullYear() ? 0 : 1;
                    })
                //tick highlighting
                svg.selectAll(".highlight").remove();
                var text = svg.append("text")
                       .attr("class", "highlight")
                       .attr("x", x(d))
                       .attr("y", height+17)
                       .attr("font-size", "0.85em")
                       .attr("text-anchor","middle")
                       .text(d.getFullYear());

                // Define the gradient
                var gradient = svg.append("svg:defs")
                      .append("svg:linearGradient")
                      .attr("id", "gradient")
                      .attr("x1", "0%")
                      .attr("y1", "100%")
                      .attr("x2", "100%")
                      .attr("y2", "100%")
                      .attr("spreadMethod", "pad");

                  // Define the gradient colors
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

                  // add rect as background to hide date display in
                  var bbox = text.node().getBBox();
                  var rect = svg.append("svg:rect")
                      .attr("class", "highlight")
                      .attr("x", bbox.x - 50)
                      .attr("y", bbox.y)
                      .attr("width", bbox.width + 100)
                      .attr("height", bbox.height)
                      .style("fill", 'url(#gradient)')
                  svg.append("text")
                       .attr("class", "highlight")
                       .attr("x", x(d))
                       .attr("y", height+17)
                       .attr("font-size", "0.85em")
                       .attr("text-anchor","middle")
                       .text(d.getFullYear());
                })
                .on("mouseout",function(d){
                    tooltip.transition().style("opacity", 0);
                    svg.selectAll(".baseline").selectAll("circle,line")
                        .style("opacity",0)
                    svg.selectAll(".highlight").remove();
                });
          }

          if(layout==="multiple"){

            y.range([height/5, margin.top]);
            yAxis.ticks(2);
            //relayout area
            area.y0(height/5)
                .y1(function(d) { return y(d.values[yValue]); });

            line.y(function(d) { return y(d.values[yValue]); });

            if (svg.select('g').empty()){

              var multi_g=svg.selectAll(".multiple")
                      .data(nested)
                      .enter().append("g")
                      .attr("height", height/5)
                      .attr("width", width)
                      .attr("transform", function(d, i) { return "translate(0," + ((4-i) * height/5) + ")"; })
                      .attr("class", "multiple")

                  var maxFlow=d3.max(nested,function(d){return d.maxFlow;})
                  y.domain([0, maxFlow]);
                  multi_g.each(function(d,i) {
                    // y.domain([0, d.maxFlow]);
                    var e = d3.select(this);
                    // var prefix = d3.formatPrefix(y.domain()[1]/2);
                    // var scale=y.domain()[1]/(prefix.scale(y.domain()[1]/2)*2)
                    // console.log(d3.round(prefix.scale(y.domain()[1]/2))*scale)
                    // yAxis.tickValues([0,d3.round(prefix.scale(y.domain()[1]/2))*scale])
                    e.append("path")
                        .attr("class", "area")
                        .attr("d", function(d) { return area(d.values); })
                        .style("fill", function(d) { return continentColors[d.key]; })
                        .style("pointer-events","none")

                    e.append("path")
                        .attr("class", "line")
                        .attr("d", function(d) { return line(d.values); })
                        .style("fill","none")
                        .style("stroke", "black")
                        .style("stroke-width", 1.5)
                        .style("pointer-events","none")

                    e.select(".baselines").remove();
                    var baseline=e.append("g").attr("class","baselines")
                                  .selectAll("g")
                                  .data(d.values)
                    var baselineEnter=baseline.enter()
                                              .append("g")
                                              .attr("class","baseline")

                      baselineEnter.append("line")
                          .attr("x1", function(d){return x(new Date(d.year,0,1))})
                          .attr("y1", height/5)
                          .attr("x2", function(d){return x(new Date(d.year,0,1))})
                          .attr("y2", function(d){return y(d.values[yValue]);})
                          .attr("stroke","grey")
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("circle")
                          .attr("r", 2.2)
                          .attr("cx", function(d){return x(new Date(d.year,0,1))})
                          .attr("cy", function(d){return y(d.values[yValue])})
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("text")
                              .text(function(d){ return format(Math.round(d.values[yValue]))+ ' £';})
                              .attr("text-anchor","middle")
                              .attr("x", function(d){return x(new Date(d.year,0,1))})
                              .attr("y", function(d){return y(d.values[yValue])-5;})
                              .style("opacity",0)
                              .style("pointer-events","none")
                      baseline.exit().remove();

                    e.append("text")
                      .attr("class","continent")
                      .text(function(d){ return d.key})
                      .attr("text-anchor","end")
                      .attr("x",-20)
                      .attr("y",height/5)
                      .attr("font-size",15)
                    // e.append("g")
                    //       .attr("class", "x axis")
                    //       .attr("transform", "translate(0,"+height/5+")")
                    //       .call(xAxis);

                    e.append("g")
                          .attr("class", "y axis")
                          .call(yAxis)
                          // .call(yAxis.tickValues(y.domain()))
                          .call(customAxis)
                          .style("pointer-events","none")
                  })
                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0,"+height+")")
                    .call(xAxis)
                    .style("pointer-events","none");
                }
            //y domain not updated
            else{
                  y.domain([0, nested[0].maxFlow]);
                  svg.selectAll(".multiple")
                      .data(nested)
                      .attr("transform", function(d, i) { return "translate(0," + ((4-i) * height/5) + ")"; })
                      .each(function(d) {
                        // y.domain([0, d.maxFlow]);
                        // var prefix = d3.formatPrefix(y.domain()[1]/2);
                        // var scale=y.domain()[1]/(prefix.scale(y.domain()[1]/2)*2)
                        // console.log(d3.round(prefix.scale(y.domain()[1]/2)))
                        // yAxis.tickValues([0,d3.round(prefix.scale(y.domain()[1]/2))*scale])
                        var e = d3.select(this);
                        e.select(".area")
                          .transition().duration(duration)
                          .attr("d", function(d) { return area(d.values); })

                        e.select(".line")
                          .transition().duration(duration)
                          .attr("d", function(d) { return line(d.values); })
                          .style("opacity",1)
                        e.select(".continent")
                            .style("opacity",1)

                    e.select(".baselines").remove();
                    var baseline=e.append("g").attr("class","baselines")
                                  .selectAll("g")
                                  .data(d.values)
                    var baselineEnter=baseline.enter()
                                              .append("g")
                                              .attr("class","baseline")

                      baselineEnter.append("line")
                          .attr("x1", function(d){return x(new Date(d.year,0,1))})
                          .attr("y1", height/5)
                          .attr("x2", function(d){return x(new Date(d.year,0,1))})
                          .attr("y2", function(d){return y(d.values[yValue]);})
                          .attr("stroke","grey")
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("circle")
                          .attr("r", 2.2)
                          .attr("cx", function(d){return x(new Date(d.year,0,1))})
                          .attr("cy", function(d){return y(d.values[yValue])})
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("text")
                              .text(function(d){ return format(Math.round(d.values[yValue]))+ ' £';})
                              .attr("text-anchor","middle")
                              .attr("x", function(d){return x(new Date(d.year,0,1))})
                              .attr("y", function(d){return y(d.values[yValue])-5;})
                              .style("opacity",0)
                              .style("pointer-events","none")
                      baseline.exit().remove();

                        // e.select(".x.axis")
                        //     .transition().duration(duration)
                        //     .attr("transform", "translate(0,"+height/5+")")
                        //     .style("opacity",1)
                        //     .call(xAxis);
                        e.select(".y.axis")
                            .transition().duration(duration)
                            .style("opacity",1)
                            .call(yAxis)
                            // .call(yAxis.tickValues(y.domain()))
                            .call(customAxis);
                      });
                  // svg.selectAll(".multiple").selectAll("text")
                  //     .transition().duration(duration)
                  //     .style("opacity",1)
                  svg.select(".x.axis").call(xAxis);
                }
          }
          if(layout==="zero" || layout==="expand"){
            //update layout stacked area
            stack.offset(layout);

            var layers=stack(nested);

            y.range([height, 0])
             .domain([0,d3.max(dataFiltered,function(d){return d.y0 + d.y;})])

            yAxis.tickValues(null)
                 .ticks(4);
            area.y0(function(d) { return y(d.y0); })
                .y1(function(d) { return y(d.y0 + d.y); });
            line.y(function(d) { return y(d.y0 + d.y); });
              // y.domain([0, d3.max(layers,function(d){
              //   return  d3.max(d.values,function(v){
              //     return v.y0+v.y;
              //   })
              // })])

            if (svg.select('g').empty()){
              var multi_g=svg.selectAll(".multiple")
                      .data(layers)

              multi_g.enter()
                    .append("g")
                    .attr("class", "multiple")
                    .each(function(d,i) {
                    var e = d3.select(this);
                    e.append("path")
                          .attr("class", "area")
                          .attr("d", function(d) { return area(d.values); })
                          .style("fill", function(d) { return continentColors[d.key]; })
                          .style("pointer-events","none")
                    e.append("path")
                            .attr("class", "line")
                            .attr("d", function(d) { return line(d.values); })
                            .style("fill","none")
                            .style("stroke", "black")
                            .style("stroke-width", 1.5)
                            .style("opacity",0)
                            .style("pointer-events","none")
                    e.append("text")
                      .attr("class","continent")
                      .text(function(d){ return d.key})
                      .attr("text-anchor","end")
                      .attr("x",-20)
                      .attr("y",height/5)
                      .attr("font-size",15)

                    e.select(".baselines").remove();
                    var baseline=e.append("g").attr("class","baselines")
                                  .selectAll("g")
                                  .data(d.values)
                    var baselineEnter=baseline.enter()
                                              .append("g")
                                              .attr("class","baseline")

                    baselineEnter.append("line")
                         .attr("x1", function(d){return x(new Date(d.year,0,1))})
                          .attr("y1", function(d){return y(d.y0);})
                          .attr("x2", function(d){return x(new Date(d.year,0,1))})
                          .attr("y2", function(d){return y(d.y0+d.y);})
                          .attr("stroke","black")
                          .style("opacity",0)
                          .style("pointer-events","none")

                    baseline.exit().remove();

                    // e.append("g")
                    //   .attr("class", "x axis")
                    //   .attr("transform", "translate(0,"+height+")")
                    //   .style("opacity",function(d,i){return i!=5 ? 0:1 })
                    //   .call(xAxis)
                    e.append("g")
                      .attr("class", "y axis")
                      .style("opacity", i!==4 ? 0:1)
                      .call(yAxis)
                      .call(customAxis)
                      .style("pointer-events","none")

                    })
              svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0,"+height+")")
                .call(xAxis)
                .style("pointer-events","none");
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
              //   //   .duration(duration)
              //   //   .attr("opacity", function(d, j) {
              //   //     return j != i ? 0.3 : 1;
              //   // })})
              //   // .on("mouseout", function(d, i) {
              //   //    svg.selectAll(".layer")
              //   //     .transition()
              //   //     .duration(duration)
              //   //     .attr("opacity", "1");})
            }
            else{
                  svg.selectAll(".multiple")
                      .data(layers)
                      .attr("transform", "translate(0,0)")
                      .each(function(d,i) {
                        var e = d3.select(this);
                        e.select(".area")
                          .transition().duration(duration)
                          .attr("d", function(d) { return area(d.values); })
                        e.select(".line")
                          .transition().duration(duration)
                          .attr("d", function(d) { return line(d.values); })
                          .style("opacity",0)
                        e.select(".continent").style("opacity",0)

                        e.select(".baselines").remove();
                        var baseline=e.append("g").attr("class","baselines")
                                  .selectAll("g")
                                  .data(d.values)
                        var baselineEnter=baseline.enter()
                                                  .append("g")
                                                  .attr("class","baseline")

                        baselineEnter.append("line")
                            .attr("x1", function(d){return x(new Date(d.year,0,1))})
                            .attr("y1", function(d){return y(d.y0);})
                            .attr("x2", function(d){return x(new Date(d.year,0,1))})
                            .attr("y2", function(d){return y(d.y0+d.y);})
                            .attr("stroke","black")
                            .style("opacity",0)
                            .style("pointer-events","none")

                        baseline.exit().remove();

                        e.select(".y.axis")
                          .transition().duration(duration)
                          .style("opacity", i!=4 ? 0:1)
                          .call(yAxis)
                          .call(customAxis)

                      });

                  svg.select(".x.axis")
                      .transition().duration(duration)
                      .call(xAxis);

                }

              /*
               * Voronoi
               */

              // // if(voronoiGroup.empty()){
              // var voronoiGroup = svg.append("g")
              //               .attr("class", "voronoi")
              //               .attr("fill", "none")
              //               .attr("pointer-events", "all")
              // // }

              // var voronoiGraph = voronoiGroup.selectAll("path")
              //   .data(voronoi(dataFiltered))


              // voronoiGraph
              //   .enter().append("path")
              //   // .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
              //   // .datum(function(d, i) { return d.point; })
              //   .attr("d", function(d) {
              //     if (d !== undefined && d.y!==0) return "M" + d.join("L") + "Z"; })
              //   .datum(function(d) { if (d !== undefined && d.y!==0) return d.point ; })
              //   .on("mouseover", mouseover)
              //   .on("mouseout", mouseout)
              //   .on('mousemove', function(d) {
              //     if(d!==undefined && d.y!==0 && d.values[yValue]!==0){
              //       var w = tooltip.style("width").replace("px", "");
              //       var h = tooltip.style("height").replace("px", "");
              //       tooltip.style("opacity", .9)
              //       .style("left", (d3.event.pageX-w/2) + "px")
              //       .style("top", (d3.event.pageY+75) + "px")
              //     }
              //   })
              //   // .on("click",function(d){
              //   //   var data=scope.ngData.filter(function(e){return e.continent===d.continent})
              //   //   svg.selectAll("g").remove();
              //   //   draw(data);
              //   // });
            }//if stacked layout

            svg.selectAll("path").attr("clip-path", "url(#clip)");

          }//end draw function
          function mouseover(d){
            if(d!==undefined && d.y!==0 && d.values[yValue]!==0){
              svg.selectAll(".area")
                .transition().duration(duration)
                .style("stroke",function(e) {
                  return e.key != d.continent ? "none" : "black";
                })
                .style("stroke-width", 1.5)
                .style("opacity", function(e) {
                  return e.key != d.continent ? 0.3 : 1;
                })

              svg.selectAll(".baseline").selectAll("line")
                  .style("stroke",function(e){
                    return e.continent != d.continent ? "grey" : "black";
                  })
                  .style("stroke-width",2)
                  .style("opacity", function(e) {
                    return e.year != d.year ? 0 : 1;
                  })
              var value = layout==="zero" ? (format(Math.round(d.y))+" £") : (d3.round(d.y*100,2)+" %");
              tooltip.html(
                "<h5>"+ d.continent + " in " + d.year + "</h5>" +
                // "<p>"+yName+": " + valueFormat(d.y) + "</p>"
                "<p>"+yName+": "+value+"</p>"
              ).transition().style("opacity", .9);

              var text = svg.append("text")
                     .attr("class", "highlight")
                     .attr("x", x(new Date(d.year,0,1)))
                     .attr("y", height+17)
                     .attr("font-size", "0.85em")
                     .attr("text-anchor","middle")
                     .text(d.year);

              // Define the gradient
              var gradient = svg.append("svg:defs")
                    .append("svg:linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                // Define the gradient colors
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

                // add rect as background to hide date display in
                var bbox = text.node().getBBox();
                var rect = svg.append("svg:rect")
                    .attr("class", "highlight")
                    .attr("x", bbox.x - 50)
                    .attr("y", bbox.y)
                    .attr("width", bbox.width + 100)
                    .attr("height", bbox.height)
                    .style("fill", 'url(#gradient)')
                svg.append("text")
                     .attr("class", "highlight")
                     .attr("x", x(new Date(d.year,0,1)))
                     .attr("y", height+17)
                     .attr("font-size", "0.85em")
                     .attr("text-anchor","middle")
                     .text(d.year);
            }
          }
          function mouseout(d){
            svg.selectAll(".area")
              .transition().duration(duration)
              .style("opacity", "1")
              .style("stroke", "none")
            svg.selectAll(".baseline").selectAll("line")
               .style("opacity", "0")
            tooltip.transition().style("opacity", 0);
            svg.selectAll(".highlight").remove();
          }

      }
    }
  }])