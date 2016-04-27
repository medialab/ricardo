'use strict';

/* Directives */
angular.module('ricardo.directives.reportingSynth', [])
  /* directive with watch, update and draw functions */
  .directive('reportingSynth', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-synth-axis"></div><div id="reporting-synth-container"></div>',
      scope: {
        ngData: '=',
        flowType: "=",
        category:"="
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue && scope.category){
              var data=group_reporting(newValue,scope.category.type.value)
            	draw(data);
            }
        });

        scope.$watch('flowType', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            yValue=newValue.type.value;
            yName=newValue.name.value;
          }
        })

        scope.$watch('category', function(newValue, oldValue) {
          if (newValue && scope.ngData) {
            category=newValue.type.value;
            categoryName=newValue.name.value;
            var data=group_reporting(scope.ngData,category)
            draw(data);
          }
        })

        // var partnerColors = {
        //       "World_best_guess":"#bf6969",
        //        "World sum partners":"#bfbf69" ,
        //        "World as reported":"#69bf69",
        //        "World estimated":"#bf69bf",
        // }

        var margin = {top: 20, right: 0, bottom: 20, left: 180 },
            width = document.querySelector('#reporting-synth-container').offsetWidth-margin.left-margin.right,
            height=100,
            offsetHeight=10;

        var minDate,maxDate;
        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var category=scope.category.type.value;
        var categoryName=scope.category.name.value;


        // var categoryColor=d3.scale.category10()
        var categoryColor  = d3.scale.ordinal()
                    .range(["#393b79","#637939", "#8c6d31","#843c39", "#7b4173"]);
        var scaleColor=d3.scale.ordinal().range(["#daafaf","#cc6666","#993333","#663333"])
        var stack = d3.layout.stack()
                              .values(function(d) { return d.values; })
                              .x(function(d) { return x(new Date(d.year,0,1)); })
                              .y(function(d) { return d.values.nb_reporting; })
                              .order("inside-out")

        var format = d3.format("0,000");
        var duration=300;


        var x = d3.time.scale()
                  .range([0, width])

        var y = d3.scale.linear()
                  .range([height, 0])


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10)

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("right")
                      .ticks(2)
                      .tickSize(width)
                      // .tickFormat(function(d,i){
                      //   if(i == 0){
                      //     return
                      //   }
                      //   else return valueFormat(d);
                      // })


        function customAxis(g) {
          g.selectAll("text")
            .attr("text-anchor","start")
            .attr("x",4)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }

        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "synth-tooltip")
                      .style("width", "150px")

        var tooltip_title=tooltip.append("div").attr("class", "title");
        var tooltip_table=tooltip.append("div").attr("class","table")

        var svg_legend = d3.select("#reporting-synth-axis").append("svg")
            .attr("width",width + margin.left + margin.right)
            .attr("height",40)
            .append("g")
            .attr("transform", "translate(" + margin.left + ","+margin.top+")");

        var svg = d3.select("#reporting-synth-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var line = d3.svg.line()
                    .interpolate("basis")
                    .defined(function(d) { return d.values.nb_reporting!==0; })
                    .x(function(d) { return x(new Date(d.key,0,1));})
                    .y(function(d) { return y(d.values.nb_reporting); });
        var partner_map={
          0:"less than 10",
          10:"10 - 50",
          50:"50 - 100",
          100:"more than 100"
        }
        var mirror_map={
          0:"0",
          0.5:"0 - 0.5",
          1:"0.5 - 1"
        }
        function group_reporting(data,curveBy){
          minDate=d3.min(data,function(d){return +d.year});
          maxDate=d3.max(data,function(d){return +d.year});

         if(curveBy==="partner"){
            // var max=d3.max(data,function(d){return d.partner.length});
            // var threshold_out=["less than 10","10 to 50","50 to 100","more than 100"]
            var threshold_out=[0,10,50,100]
            var threshold_in=[10,50,100]

          }
          else if(curveBy==="mirror_rate"){
            var threshold_out=[0,0.5,1]
            var threshold_in=[0.01,0.5]
            data=data.filter(function(d){return d[curveBy]!==undefined})
          }
          var thresScale=d3.scale.threshold()
                            .domain(threshold_in)
                            .range(threshold_out)

          var nbReportings=d3.nest()
                            .key(function(d) {
                              if(curveBy==="partner") return thresScale(d[curveBy].length)
                              else if(curveBy==="mirror_rate") return thresScale(d[curveBy])
                              else return d[curveBy]
                            })
                            .key(function(d) { return d.year; })
                            .rollup(function(v) { return {
                              nb_reporting:v.length
                              }
                            })
                           .entries(data);
          //extend missing points with null values
          nbReportings.forEach(function(d){
              // for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
              d.values.forEach(function(v){
                v.key=+v.key
              })
              for (var i = minDate; i<= maxDate;i++){
                var years=d.values.map(function(year){ return year.key});
                if (years.indexOf(i)=== -1){
                  d.values.push({
                    key:i,
                    values:{
                      nb_reporting:0
                    }
                  })
                }
              }
              //sort by year ascending
              d.values.sort(function(a,b){
                return a.key-b.key;
              });
          })//add missing with null
          return nbReportings;
        }
        function draw_legend(color_domain){
          svg_legend.selectAll("g").remove()
            var legend=svg_legend.selectAll(".legend")
                    .data(color_domain)
                    .enter()
                    .append("g")
                    .attr("class","legend")

            legend.append("rect")
                  .attr("width",10)
                  .attr("height",10)
                  .style("fill",function(d){return category==="partner" || category==="mirror_rate"? scaleColor(d):categoryColor(d)})
            legend.append("text")
                  .attr("x",15)
                  .attr("y",10)
                  .text(function(d){
                    if (category==="partner") return partner_map[d];
                    else if(category==="mirror_rate") return mirror_map[d];
                    else return d;
                  })
                  .attr("font-size",11)
            var legend_offset=0

            svg_legend.selectAll(".legend")
                  .attr("transform",function(d,i){
                    if(i===0) return "translate(0,0)"
                    else {
                      var prevtext=d3.select(this.previousElementSibling).select("text").node().getBBox()
                      legend_offset=legend_offset+prevtext.width+20
                      return "translate("+legend_offset+",0)"
                    }
                  })
        }
        function draw(data) {

          var layers=stack(data)

          // var minDate=d3.min(data[0].values,function(d){return +d.key});
          // var maxDate=d3.max(data[0].values,function(d){return +d.key});

          var barwidth=Math.floor(width/(maxDate-minDate))
          var maxReporting=d3.max(layers, function(d) {
            return d3.max(d.values,function(v){
              return v.y0+v.y
            })
          });

          var color_domain=data.map(function(d){return d.key;})
                                .sort(function(a, b){return (category==="partner"||category==="mirror_rate")? d3.ascending(+a, +b):d3.descending(a, b);})//need sorted

          if(category==="partner" || category==="mirror_rate") scaleColor.domain(color_domain)
          else categoryColor.domain(color_domain)
          draw_legend(color_domain)

          x.domain([new Date(minDate,0,1), new Date(maxDate,0,1)]);
          y.domain([0,maxReporting])

          svg.selectAll("g").remove()
          var backbar=svg.append("g").selectAll(".background")
                      .data(d3.range(minDate,maxDate)).enter()
                      .append("rect")
                      .attr("class","background")
                      .attr("x", function(d) { return x(new Date(d,0,1)); })
                      .attr("height", function(d) { return height; })
                      .attr("width", barwidth-1)
                      .style("fill","lightgrey")
                      .style("opacity",0)
                      .attr("pointer-events","all")
                      .on("mouseover",function(d){
                        d3.select(this).style("opacity",1)
                        d3.selectAll('.layer').selectAll("rect").filter(function(layer){return layer.key===d}).style("opacity",1)
                        tooltip.transition().style("display", "block").style("opacity", .9);
                        var selectBar=data.map(function(layer){
                            var l=layer.values.filter(function(e){return e.key===d})
                            return {
                              key:layer.key,
                              value:l[0].values.nb_reporting
                            }
                          })
                        selectBar.sort(function(a,b){return b.value-a.value})
                        selectBar=selectBar.filter(function(d){return d.value!==0})
                        selectBar.push({
                          key:"Total",
                          value: d3.sum(selectBar,function(d){return d.value})
                        })
                        tooltip_title.html("<h5>Number of Reportings in "+d+"</h5")
                        // create table
                        tooltip_table.html("<p>By "+categoryName+"</p>")
                        tooltip_table.select("table").remove()
                        var table = tooltip_table.append("table")
                        var tr = table.selectAll(".row").data(selectBar).enter().append("tr").attr("class","row");
                        // create the first column for each segment.
                        tr.append("td").append("svg").attr("width", '6').attr("height", '6').append("rect")
                          .attr("width", '6').attr("height", '6')
                          .attr("fill",function(d){
                              if(d.key!=="Total") return category==="partner"||category==="mirror_rate"? scaleColor(d.key):categoryColor(d.key)
                              else return "none"
                          })

                        // create the second column for each segment.
                        tr.append("td").text(function(d){
                          if (category==="partner" && d.key!=="Total") return partner_map[d.key];
                          else if(category==="mirror_rate" && d.key!=="Total") return mirror_map[d.key];
                          else return d.key;
                        })

                        // create the third column for each segment.
                        tr.append("td").text(function(d){ return d.value}).style("text-align","right");

                      })
                      .on("mousemove",function(d){
                        tooltip.style("left", d3.event.pageX+20 + "px")
                               .style("top", "300px")
                      })
                      .on("mouseout",function(d){
                        d3.select(this).style("opacity",0)
                        d3.selectAll('.layer').selectAll("rect")
                        .style("opacity",function(d){
                          return category==="partner" || category==="mirror_rate" ? 0.9:0.7;
                        })
                        tooltip.transition().style("display", "none")
                      })


          var layer = svg.selectAll(".layer")
              .data(layers)
              .enter().append("g")
                .attr("class", "layer")
                .style("fill", function(d) { return category==="partner" || category==="mirror_rate"? scaleColor(d.key):categoryColor(d.key) })

          layer.selectAll("rect")
              .data(function(d) { return d.values; })
              .enter().append("rect")
              .attr("x", function(d) { return x(new Date(d.key,0,1)); })
              .attr("y", function(d) { return y(d.y + d.y0); })
              .attr("height", function(d) { return y(d.y0) - y(d.y + d.y0); })
              .attr("width", barwidth-1)
              .style("opacity",function(d){return category==="partner" || category==="mirror_rate" ? 0.9:0.7;})
              .attr("pointer-events","none")



          // var multi_g=svg.selectAll(".multiple")
          //                 .data(data)
          //         multi_g.enter()
          //               .append("g")
          //               .attr("class", "multiple")
          //               .each(function(d,i) {
          //                 var e = d3.select(this);
          //                 // e.append("path")
          //                 //       .attr("class", "area-total")
          //                 //       .attr("d", function(d) { return area(d.values); })
          //                 //       .style("pointer-events","none")
          //                 e.append("path")
          //                         .attr("class", "line")
          //                         .attr("d", function(d) {return line(d.values); })
          //                         .style("fill","none")
          //                         .style("stroke",function(){return category==="partner"? scaleColor(d.key):categoryColor(d.key) })
          //                         .style("stroke-width", 1.5)
          //                         .style("pointer-events","none")
          //               })
                  svg.append("g")
                          .attr("class", "y axis")
                          .call(yAxis)
                          .call(customAxis)
                          .style("pointer-events","none")

                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0,"+height+")")
                    .call(xAxis)
                    .style("pointer-events","none");
        }//end draw function
      }
    }
  }])