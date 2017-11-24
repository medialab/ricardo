'use strict';

/* Directives */

angular.module('ricardo.directives.reportingWorld', [])

  /* directive with watch, update and draw functions */
  .directive('reportingWorld', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-world-container"></div>',
      scope: {
        ngData: '=',
        startDate: '=',
        endDate: '=',
        flowType: "=",
        layout: "="
      },
      link: function(scope, element, attrs) {

         scope.$watchCollection('[ngData,startDate,endDate,flowType,layout]', function(newValue, oldValue) {
            if(newValue[0]){
              yValue=newValue[3].type.value;
              yName=newValue[3].name.value;
              layout=newValue[4].type.value;
              draw(newValue[0]);
            }
          });

        var categoryColors = {
               "World sum partners":"#bcbd22" ,
               "World as reported":"#b82e2e",
               "World Federico Tena":"#109618",
               "World_best_guess":"#316395",
        }
        // var partnerColors=d3.scale.category10()

        function partnerColors(partner) {
          return categoryColors[partner]
        }

        var margin = {top: 20, right: 0, bottom: 40, left: 0 },
            width = document.querySelector('#reporting-world-container').offsetWidth-margin.left-margin.right,
            height=300,
            offsetHeight=10,
            partners=4;
        var bisector = d3.bisector(function(d) {return d.year;}).left;

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var layout=scope.layout.type.value;

        var color = d3.scale.category10();
        var format = d3.format("0,000");
        var duration=300;


        var x = d3.time.scale()
                  .range([0, width]);

        var y = d3.scale.linear()


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10)

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("right")
                      .tickSize(width)
                      .ticks(2)
                      .tickFormat(function(d,i){
                        if(i == 0){
                          return
                        }
                        else return valueFormat(d);
                      })
        function valueFormat(d){
          var prefix = d3.formatPrefix(d)
            var symbol;
            if(layout==="single"||layout==="multiple"){
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
            .attr("x",4)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }
        var svg = d3.select("#reporting-world-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // svg.append("clipPath")
        //     .attr("id", "clip")
        //     .append("rect")
        //     .attr("width", width)
        //     .attr("height", height);


        var line = d3.svg.line()
                    .defined(function(d) { return d[yValue]!==null; })
                    .x(function(d) { return x(new Date(d.year,0,1));})
                    .y(function(d) { return y(d[yValue]); });

        var area = d3.svg.area()
                    .defined(function(d) { return d[yValue]!==null; })
                    .x(function(d) {return x(new Date(d.year,0,1));})
                    // .y0(height/3)
                    // .y1(function(d) { return y(d[yValue]); });
                    // .y0(function(d) { return y(d.y0); })
                    // .y1(function(d) { return y(d.y0 + d.y); });

        // var voronoi = d3.geom.voronoi()
        //         .x(function(d) { return x(new Date(d.year,0,1)); })
        //         .y(function(d) { return y(d.y0+d.y/2); })
        //         // .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        //         .clipExtent([[0,0],[width,height]])

        // var bisect = d3.bisector(function(d) { return d.date;}).left;

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

          //flatten data for tooltip
          var data_flatten=[]
          data.forEach(function(d){
            d.values.forEach(function(v){
              data_flatten.push(
                {
                  "partner":d.key,
                  "year":v.year,
                  "values":v
                }
              )
            })
          })

          x.domain([new Date(scope.startDate-1,0,1), new Date(scope.endDate+1,0,1)]);
          // y.domain([0,maxFlow])

          var dataFiltered=data_flatten.filter(function(d){
            return d.year>=x.domain()[0].getFullYear() && d.year<= x.domain()[1].getFullYear();
          })

          var maxFlow=d3.max(dataFiltered, function(d) {
            return d.values[yValue]
          })
          //compute ymax for mutliples
          // data.forEach(function(n) {
          //   var nestedFiltered=n.values.filter(function(d){
          //     return d.year>=x.domain()[0].getFullYear() && d.year<= x.domain()[1].getFullYear();
          //   })
          //   n.maxFlow = d3.max(nestedFiltered, function(d) { return d[yValue]; });
          // });
          // var maxFlow=d3.max(nested,function(d){return d.maxFlow;})
          y.domain([0, maxFlow]);

          if(layout==="multiple"){
            yAxis.ticks(2)
            y.range([height/partners, margin.top]);
            area.y0(height/partners)
                .y1(function(d) {return y(d[yValue]); });

            if (svg.select('g').empty()){
              var multi_g=svg.selectAll(".multiple")
                      .data(data)
                      .enter().append("g")
                      .attr("height", height/partners)
                      .attr("width", width)
                      .attr("transform", function(d, i) { return "translate(0," + ((partners-1-i) * height/partners) + ")"; })
                      .attr("class", "multiple")

                  multi_g.each(function(d,i) {
                    // y.domain([0, d.maxFlow]);
                    var e = d3.select(this);
                    // var prefix = d3.formatPrefix(y.domain()[1]/2);
                    // var scale=y.domain()[1]/(prefix.scale(y.domain()[1]/2)*2)
                    // console.log(d3.round(prefix.scale(y.domain()[1]/2))*scale)
                    // yAxis.tickValues([0,d3.round(prefix.scale(y.domain()[1]/2))*scale])
                    e.append("path")
                        .attr("class", "area-total")
                        .attr("d", function(d) { return area(d.values); })
                        .style("pointer-events","none")
                        .style("opacity",1)

                    e.append("path")
                        .attr("class", "line")
                        .attr("d", function(d) { return line(d.values); })
                        .style("fill","none")
                        .style("stroke",partnerColors(d.key))
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
                          .attr("y1", height/partners)
                          .attr("x2", function(d){return x(new Date(d.year,0,1))})
                          .attr("y2", function(d){return y(d[yValue]);})
                          .attr("stroke","grey")
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("circle")
                          .attr("r", 2.2)
                          .attr("cx", function(d){return x(new Date(d.year,0,1))})
                          .attr("cy", function(d){return y(d[yValue])})
                          .style("opacity",0)
                          .style("pointer-events","none")

                      // baselineEnter.append("text")
                      //         .text(function(d){ return format(Math.round(d[yValue]))+ ' £';})
                      //         .attr("text-anchor","middle")
                      //         .attr("x", function(d){return x(new Date(d.year,0,1))})
                      //         .attr("y", function(d){return y(d[yValue])-5;})
                      //         .style("opacity",0)
                      //         .style("pointer-events","none")
                      baseline.exit().remove();

                    // e.append("text")
                    //   .attr("class","partner")
                    //   .text(function(d){ return d.key})
                    //   .attr("text-anchor","start")
                    //   .attr("y",height/3-margin.top)
                    //   .attr("font-size",15)
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
                  svg.selectAll(".multiple")
                      .data(data)
                      .attr("transform", function(d, i) { return "translate(0," + ((partners-1-i) * height/partners) + ")"; })
                      .each(function(d) {
                        var e = d3.select(this);

                        e.select(".area-total")
                          .transition().duration(duration)
                          .attr("d", function(d) { return area(d.values); })
                          .style("opacity",1)

                        e.select(".line")
                          .transition().duration(duration)
                          .attr("d", function(d) { return line(d.values); })
                        e.select('.partner').style("opacity",1)

                    e.select(".baselines").remove();
                    var baseline=e.append("g").attr("class","baselines")
                                  .selectAll("g")
                                  .data(d.values)

                    var baselineEnter=baseline.enter()
                                              .append("g")
                                              .attr("class","baseline")

                      baselineEnter.append("line")
                          .attr("x1", function(d){return x(new Date(d.year,0,1))})
                          .attr("y1", height/partners)
                          .attr("x2", function(d){return x(new Date(d.year,0,1))})
                          .attr("y2", function(d){return y(d[yValue]);})
                          .attr("stroke","grey")
                          .style("opacity",0)
                          .style("pointer-events","none")

                      baselineEnter.append("circle")
                          .attr("r", 2.2)
                          .attr("cx", function(d){return x(new Date(d.year,0,1))})
                          .attr("cy", function(d){return y(d[yValue])})
                          .style("opacity",0)
                          .style("pointer-events","none")
                      baseline.exit().remove();

                      e.select(".y.axis")
                          .transition().duration(duration)
                          .call(yAxis)
                          .style("opacity",1)
                          // .call(yAxis.tickValues(y.domain()))
                          .call(customAxis);
                      });
                  // svg.selectAll(".multiple").selectAll("text")
                  //     .transition().duration(duration)
                  //     .style("opacity",1)
                 svg.select(".x.axis")
                  .transition().duration(duration)
                  .call(xAxis);
                }
              }//if multiple layout

             if(layout==="single"){
                yAxis.ticks(4)

                y.range([height, 0]).domain([0,maxFlow]);

                area.y0(height)
                    .y1(function(d) { return y(d[yValue]);});

                if (svg.select('g').empty()){
                  var multi_g=svg.selectAll(".multiple")
                          .data(data)
                  multi_g.enter()
                        .append("g")
                        .attr("class", "multiple")
                        .each(function(d,i) {
                        var e = d3.select(this);
                        e.append("path")
                              .attr("class", "area-total")
                              .attr("d", function(d) { return area(d.values); })
                              .style("pointer-events","none")
                              .style("opacity",0)

                        e.append("path")
                                .attr("class", "line")
                                .attr("d", function(d) { return line(d.values); })
                                .style("fill","none")
                                .style("stroke",function(){return partnerColors(d.key)})
                                .style("stroke-width", 1.5)
                                .style("pointer-events","none")

                         e.append("text")
                          .attr("class","partner")
                          .text(function(d){ return d.key})
                          .attr("text-anchor","start")
                          .attr("y",height/partners-margin.top)
                          .attr("font-size",15)
                          .style("opacity",0)

                       e.select(".baselines").remove();
                        var baseline=e.append("g").attr("class","baselines")
                                      .selectAll("g")
                                      .data(d.values)

                        var baselineEnter=baseline.enter()
                                                  .append("g")
                                                  .attr("class","baseline")

                          baselineEnter.append("line")
                              .attr("x1", function(d){return x(new Date(d.year,0,1))})
                              .attr("y1", function(d){return y(0);})
                              .attr("x2", function(d){return x(new Date(d.year,0,1))})
                              .attr("y2", function(d){return y(d[yValue]);})
                              .attr("stroke","grey")
                              .style("opacity",0)
                              .style("pointer-events","none")

                          baselineEnter.append("circle")
                              .attr("r", 2.2)
                              .attr("cx", function(d){return x(new Date(d.year,0,1))})
                              .attr("cy", function(d){return y(d[yValue])})
                              .style("opacity",0)
                              .style("pointer-events","none")
                          baseline.exit().remove();

                        e.append("g")
                          .attr("class", "y axis")
                          .style("opacity", i!==2 ? 0:1)
                          .call(yAxis)
                          .call(customAxis)
                          .style("pointer-events","none")

                        })
                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0,"+height+")")
                    .call(xAxis)
                    .style("pointer-events","none");

                }
                else{
                      svg.selectAll(".multiple")
                          .data(data)
                          .attr("transform", "translate(0,0)")
                          .each(function(d,i) {
                            var e = d3.select(this);
                            e.select(".area-total")
                              .transition().duration(duration)
                              .attr("d", function(d) { return area(d.values); })
                              .style("opacity",0)

                            e.select(".line")
                              .transition().duration(duration)
                              .attr("d", function(d) { return line(d.values); })

                            e.select(".partner").style("opacity",0)

                            e.select(".baselines").remove();
                            var baseline=e.append("g").attr("class","baselines")
                                          .selectAll("g")
                                          .data(d.values)

                            var baselineEnter=baseline.enter()
                                                      .append("g")
                                                      .attr("class","baseline")

                              baselineEnter.append("line")
                                  .attr("x1", function(d){return x(new Date(d.year,0,1))})
                                  .attr("y1", function(d){return y(0);})
                                  .attr("x2", function(d){return x(new Date(d.year,0,1))})
                                  .attr("y2", function(d){return y(d[yValue]);})
                                  .attr("stroke","grey")
                                  .style("opacity",0)
                                  .style("pointer-events","none")

                              baselineEnter.append("circle")
                                  .attr("r", 2.2)
                                  .attr("cx", function(d){return x(new Date(d.year,0,1))})
                                  .attr("cy", function(d){return y(d[yValue])})
                                  .style("opacity",0)
                                  .style("pointer-events","none")
                              baseline.exit().remove();

                            e.select(".y.axis")
                              .transition().duration(duration)
                              .style("opacity", i!=partners-1 ? 0:1)
                              .call(yAxis)
                              .call(customAxis)

                          });

                      svg.select(".x.axis")
                          .transition().duration(duration)
                          .call(xAxis);

                    }
             }//if single layout
            svg.select('.overlay').remove();
              if (svg.select('.overlay').empty()){
                svg.append("rect")
                  .attr('class', 'overlay')
                  .attr('width', width)
                  .attr('height', height)
                  .attr("fill","none")
                  .style("pointer-events","all")
                  .on("mouseover", function(d){
                    tooltip.transition().style("opacity", .9);
                  })
                  .on("mousemove", function(){
                    tooltip.style("opacity", .9)
                    .style("left", function(){
                      if (d3.event.pageX-margin.left<9*width/10) return (d3.event.pageX+20)+ "px";
                      else return (d3.event.pageX-220)+ "px"
                    })
                    // .style("top", (d3.event.pageY+75) + "px")
                    .style("top", "650px")

                    var mouse = d3.mouse(this),
                        mouseDate=x.invert(mouse[0]),
                        mouseYear = mouseDate.getFullYear(),
                        d0 = new Date(mouseYear,0,1),
                        d1 = new Date(mouseYear+1,0,1),
                        d = mouse - d0 > d1 - mouse ? d1 : d0;
                    // console.log(d)
                    var selectData=data_flatten.filter(function(e){return e.year===d.getFullYear()})

                    if(selectData.length>0){
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
                                 .attr("width",function(d){return d.values[yValue]!==null ? x_tip(d.values[yValue]):0})
                                 .attr("height",10)
                                 .attr("fill",function(d){return partnerColors(d.partner)});
                      tip_partner.append("text")
                                 .text(function(d){return d.partner})
                                 .attr("class","partnerLabel")
                                 .attr("y",-2)
                                 .attr("fill","#fff")
                                 .attr("font-size",11)
                      tip_partner.append("text")
                                 .text(function(d){
                                    return d[yValue]!==null ? format(Math.round(d.values[yValue]))+" £" : "N/A";
                                  })
                                 .attr("x",function(d){return d.values[yValue]!==null ? x_tip(d.values[yValue])+2: 2})
                                 .attr("y",9)
                                 .attr("text-anchor",function(d,i){
                                   if(i===0 && d.values[yValue]!==null) return "end"
                                   else if(d.values[yValue]>selectData[0].values[yValue]/2) return "end"
                                   else return "start"
                                 })
                                 .attr("fill","#fff")
                                 .attr("font-size",12)

                      svg.selectAll(".baseline").selectAll("circle,line")
                          .filter(function(d){return d[yValue]!==null;})
                          .style("opacity", function(e) {
                            return e.year != d.getFullYear() ? 0 : 1;
                          })
                    }
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
        }//end draw function
      }
    }
  }])
