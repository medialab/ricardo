'use strict';
/* Directives */
angular.module('ricardo.directives.reportingEntities', [])

  /* directive with watch, update and draw functions */
  .directive('reportingEntities', [function(){
    return {
      restrict: 'E',
      // template: '<div style="height:140px" id="reporting-entities-axis"></div><div id="reporting-entities-container"></div>',
      template: '<div id="reporting-entities-container"></div>',
      scope: {
          flatData: "=",
          ngData: '=',
          flowType:"=",
          color: "=",
          layout: "=",
          reporting:"=",
          search:"=",
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue){
              draw(newValue);
            }
        });
        scope.$watch('flowType', function(newValue, oldValue) {
          if (newValue!==oldValue && scope.ngData ) {
            yValue=newValue.type.value;
            yName=newValue.name.value;
            // draw(scope.ngData);
          }
        })
        scope.$watch('layout', function(newValue, oldValue) {
          if(newValue && scope.ngData){
            layout=newValue.type.value;
            layoutName=newValue.name.value;
            var data=order(layout,scope.ngData);
            reorder(data);
          }
        })
        scope.$watch('color', function(newValue, oldValue) {
          if (newValue!==oldValue) {
            colorBy=newValue.type.value;
            colorName=newValue.name.value;
            recolor(colorBy,scope.ngData);
            // if (colorBy==="partner") yValue="exp_partner" //test for actualreport
          }
        })

        scope.$watch('search', function(newValue, oldValue) {
          if (newValue) {
            var offsetDiv=$("#reporting-entities-container").offset().top;
            var offsetTop=d3.select("#r_"+scope.reporting).node().getCTM().f;
            d3.selectAll(".entities").selectAll(".rlabel,.overlay").style("stroke","none");
            d3.select("#r_"+scope.reporting).selectAll(".rlabel,.overlay").style("stroke","black").transition().delay(2000).duration(2000).style("stroke","none")
            // setTimeout(function(){
            //   setInterval(function(){
            //     d3.select("#r_"+scope.reporting).selectAll(".rlabel,.overlay").style("stroke","black").transition().style("stroke","none")
            //   },2000)
            // },4000)
            $("#reporting-entities-container").animate({scrollTop:offsetTop-300},500);
            // searchFixed=true;
          }
        })

        // scope.$watch('group', function(newValue, oldValue) {
        //   if (newValue){
        //     svg_g.selectAll(".entities,.margin.axis").style("display","none")
        //     svg_g.select(".num.axis").style("opacity",1)
        //     d3.select("#reporting-entities-container")
        //       .style("height",nb_height)
        //       .style("overflow","initial")
        //     regroup(colorBy)
        //   }
        //   else {
        //     d3.select("#reporting-entities-container")
        //       .style("height","800px")
        //       .style("overflow","scroll")
        //     svg_g.selectAll(".entities").style("display","block")
        //     svg_g.select(".num.axis").style("opacity",0)
        //     d3.selectAll(".available")
        //        .attr("x", function(d) { return x(new Date(d.year,0,1));})
        //        .attr("y",function(d){return y(d.reporting)})
        //        .attr("width", gridWidth-gridGap)
        //        .attr("height", gridHeight-gridGap )
        //        .style("fill",function(d){
        //           if(colorBy==="type"||colorBy==="continent"||colorBy==="sourcetype"|| colorBy==="reference") return categoryColor(d[colorBy])
        //           else return scaleColor(d[colorBy].length)
        //          })
        //         .style("opacity",function(v){
        //           if(colorBy==="partner" || colorBy==="flow") return 1
        //           else return 0.7
        //         })
        //   }
        // })
        function regroup(colorBy){
          var yearData=scope.flatData.sort(function(a, b){
            if(colorBy==="partner") return d3.descending(a[colorBy].length, b[colorBy].length)
            else return d3.descending(a[colorBy], b[colorBy])
          })
          // y= d3.scale.linear()
          //       .range([0, 600])
          //       .domain(d3.extent(yearData,function(d){return d[colorBy]}));
          var years=d3.nest().key(function(d){return d})
                    .rollup(function(values) { return values.length-1; })
                    .map(d3.range(1786,1938));

          d3.selectAll(".available")
            .data(yearData)
            .attr('height',4)
            .style("fill",function(d){
                  if(colorBy==="type"||colorBy==="continent"||colorBy==="sourcetype"|| colorBy==="reference") return categoryColor(d[colorBy])
                  else return scaleColor(d[colorBy].length)
                 })
                .style("opacity",function(v){
                  if(colorBy==="partner" || colorBy==="mirror_rate") return 1
                  else return 0.5
                })
            .attr("x", function(d) { return x(new Date(d.year,0,1));})
            .attr("y", function(d) {
                  var topping = years[+d.year];
                  years[+d.year] += 1;
                  if (topping) return topping*5;
                })
        }
        var continentMap={
           "Europe":1,
           "America":2,
           "Africa":3,
           "Asia":4,
           "Oceania":5
        }
        var typeMap={
           "country":1,
           "city/part_of":2,
           "group":3,
           "colonial_area":4
        }
        var continentColors = {
                    "Europe":"#bf6969",
                     "Asia":"#bfbf69" ,
                     "Africa":"#69bfbf",
                     "America":"#69bf69",
                     "World":"#bf69bf",
                     "Oceania":"#6969bf",
                     "Pacific":"lightgrey",
                     "Mediterranean":"lightblue",
                     "Baltic":"white",
                     "Antarctic":"grey",
                     "Atlantic Ocean":"blue"
                    }


        // var categoryColor=d3.scale.category10()
        var categoryColor  = d3.scale.ordinal()
                    .range(["#393b79","#637939", "#8c6d31","#843c39", "#7b4173"]);

        function colorByContinent(continent) {
          return continentColors[continent]
        }

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var layout=scope.layout.type.value;
        var layoutName=scope.layout.name.value;
        var colorBy=scope.color.type.value;
        var colorName=scope.color.name.value;

        var margin = {top: 0, right: 0, bottom: 40, left: 180},
            width = document.querySelector('#reporting-entities-container').offsetWidth-margin.left-margin.right,
            height,
            offset=30,
            orders
        var svg_g=d3.select("#reporting-entities-container").append("svg")


        var gridHeight=10,
            gridGap=1
        var gridWidth=width/(1938-1786);

        var legendWidth=60

        var x = d3.time.scale()
                .range([0, width])

        var y = d3.scale.ordinal()
        var z=d3.scale.linear().range([0.2,1])
        var scaleColor
        var numScale=d3.scale.linear()

        var marginScale=d3.scale.linear()
                        .range([margin.left-offset,2])


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .ticks(10);

        var numAxis = d3.svg.axis()
                      .scale(numScale)
                      .orient("left")
                      .ticks(4)
                      .tickFormat(function(d,i){
                        if(i == 0){
                          return
                        }
                        else return d;
                      });

        var marginAxis = d3.svg.axis()
            .scale(marginScale)
            .orient("top")
            .ticks(2)
            // .tickSize(0)
            .tickFormat(function(d,i){
              if(i == 0){
                return
              }
              else return valueFormat(d);
            });

        function valueFormat(d){
          var prefix = d3.formatPrefix(d)
            var symbol;
            if(layout==="flowAvg" || colorBy==="flow"){
              if(prefix.symbol === "G"){
                symbol = "b"
              }else if(prefix.symbol === "M"){
                symbol = "m"
              }else if(prefix.symbol === "k"){
                symbol = "k"
              }else{
                symbol = "";
              }
              return d3.round(prefix.scale(d)) + " " + symbol
            }
            else return d
        }

        var margin_axis = {top: 135, right: 0, bottom: 40, left: 180}
        var svg_axis = d3.select("#reporting-entities-axis").append("svg")
            .attr("width",width + margin.left + margin.right)
            .attr("height",140)
            .append("g")
            .attr("transform", "translate(" + margin_axis.left + ","+margin_axis.top+")");
        svg_axis.append("g")
                .attr("class", "x axis")
                .call(xAxis);

        svg_axis.append("g")
                .attr("transform", "translate(-" + (2+margin_axis.left-offset) + ",0)")
                .attr("class", "margin axis")
                .append("text")
                .attr("y",-20)
                .attr("font-size",11)
                .text(layoutName)

//////////////////////////////////////////////////////
////////////////// Tooltips Setup //////////////////
//////////////////////////////////////////////////////
        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "matrix-tooltip")
                      .style("width", "200px")
        var tooltip_margin = d3.select("body")
                      .append("div")
                      .attr("class", "matrix-tooltip")

        var tip_margin = {top: 10, right: 0, bottom: 10, left:0},
            tip_width = document.querySelector('.matrix-tooltip').offsetWidth-tip_margin.left-tip_margin.right
            // tip_height= document.querySelector('.matrix-tooltip').offsetHeight-tip_margin.top-tip_margin.bottom
        tooltip.append("div").attr("class", "title");
        tooltip.append("div").attr("class","tip_svg");
        tooltip.append("div").attr("class","table");
        // tooltip.append("div").attr("class","tip_venn")

        tooltip.append("div").attr("class","source")
        // var tip_max=d3.max(data,function(d){
        //   return d3.max(d.values,function(v){
        //     return d3.max(v.partner_continent,function(n){
        //       return n.number;
        //     })
        //   })})
        // console.log([tip_width,tip_height])
        var x_tip=d3.scale.linear().range([0,tip_width-40])
        var y_tip=d3.scale.ordinal().rangeRoundBands([0,100])


        var  searchFixed=false;
        // Precompute the orders.

        var countByType=[]
        var countByContinent=[]

        function recolor_legend(colorBy,data){

          svg_axis.select(".legend").remove()
          if(colorBy==="partner"){
            // yValue="exp_partner"

            var max=d3.max(data,function(d){return d3.max(d.values,function(v){return +v[colorBy].length})});
            var values=[]
            data.forEach(function(d){
              d.values.forEach(function(v){
                values.push(v[colorBy].length)
              })
            })

            var threshold_out=[0,10,50,100,max]
            var threshold_in=[10,50,100]
            var threshold_color=["#daafaf","#cc6666","#993333","#663333"]

            scaleColor=d3.scale.threshold()
                            .domain(threshold_in)
                            .range(threshold_color)
            var legendData=[
                {"label":"N/A",
                  "value":"lightgrey"
                },
                {"label":"<"+valueFormat(d3.round(max/10)),
                  "value":"#daafaf"
                },
                {"label":valueFormat(d3.round(max/10))+"-"+valueFormat(d3.round(max/4)),
                  "value":"#cc6666"
                },
                {"label":valueFormat(d3.round(max/4))+"-"+valueFormat(d3.round(max*2/3)),
                  "value":"#993333"
                },
                {"label":">"+valueFormat(d3.round(max*2/3)),
                  "value":"#663333"
                },
            ]
            var legend=svg_axis.append("g")
                     .attr("class","legend")
                     .attr("transform", "translate("+3*width/4+",-140)");
            var legend_height=100
            var legend_margin=10

            var x_legend = d3.scale.linear()
                  .domain([0,max])
                  .range([0, width/4-legend_margin]);

              // Generate a histogram using twenty uniformly-spaced bins.
              var data_legend = d3.layout.histogram()
                  .bins(20)
                  (values);

              var y_legend = d3.scale.linear()
                  .domain([0, d3.max(data_legend, function(d) { return d.y; })])
                  .range([legend_height-legend_margin, 0]);


              var xAxis_legend = d3.svg.axis()
                  .scale(x_legend)
                  .tickValues(threshold_out)
                  // .ticks(4)
                  .orient("bottom");

              var bar = legend.selectAll(".bar")
                  .data(data_legend)
                  .enter().append("g")
                  .attr("class", "histo_bar")
                  .attr("transform", function(d) { return "translate(" + x_legend(d.x) + "," + y_legend(d.y) + ")"; });

              bar.append("rect")
                  .attr("x", 1)
                  .attr("width", x_legend(data_legend[0].dx) - 1)
                  .attr("height", function(d) { return legend_height-legend_margin - y_legend(d.y); })
                  .style("fill",function(d){return scaleColor(Math.ceil(d.x))});

              legend.selectAll(".interval_rect")
                    .data(threshold_out).enter()
                    .append('rect')
                    .attr("class","interval_rect")
                    .attr("x",function(d){return x_legend(d);})
                    .attr("width",function(d,i){
                      if(i<threshold_out.length-1) return x_legend(threshold_out[i+1])-x_legend(threshold_out[i])
                      else return 0;
                    })
                    .attr("height", 8)
                    .attr("y",legend_height-legend_margin+1)
                    .style("fill",function(d){return scaleColor(d)});

            legend.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + legend_height + ")")
                  .call(xAxis_legend);
            // legend.append("text")
            //       .text(colorName)
            //       .attr("x",-5)
            //       .attr("y",6)
            //       .attr("font-size",11)
            //       .attr("text-anchor","end")

            // var legend_g=legend.selectAll("g")
            //       .data(legendData)
            //       .enter().append("g")
            //       .attr("transform", function(d,i){return "translate("+i*legendWidth+",0)"});

            // legend_g.append("rect")
            //       .attr("y", 0)
            //       .attr("width", legendWidth)
            //       .attr("height", 10)
            //       .style("fill", function(d){return d.value;})

            // legend_g.append("text")
            //         .text(function(d){return d.label})
            //         .attr("text-anchor","start")
            //         .attr("y",-5)
            //         .attr("font-size",11)
          }
          else{

            svg_axis.select(".legend").remove()

            var legend=svg_axis.append("g")
                        .attr("class","legend")
                        .attr("transform","translate("+width*3/4+",-130)")

            var legend_g=legend.selectAll("g")
                        .data(categoryColor.domain())
                        .enter().append("g")
                        .attr("transform", function(d,i){return "translate(0,"+i*20+")"});
            legend_g.append("rect")
                    .attr("width",10)
                    .attr("height",10)
                    .style("fill",function(d){return categoryColor(d)})
            legend_g.append("text")
                    .text(function(d){return d})
                    .attr("x",15)
                    .attr("y",10)
                    .attr("font-size",11)
          }
        }
        function updateColor(colorBy,data){
          if(colorBy==="partner"){
            // var max=d3.max(data,function(d){return d3.max(d.values,function(v){return +v[colorBy].length})});
            // var threshold_out=[0,10,50,100,max]
            var threshold_in=[10,50,100]
            var threshold_color=["#daafaf","#cc6666","#993333","#663333"]

            scaleColor=d3.scale.threshold()
                            .domain(threshold_in)
                            .range(threshold_color)
          }
          else if(colorBy==="mirror_rate"){
            // var max=d3.max(data,function(d){return d3.max(d.values,function(v){return +v[colorBy]})});
            // var threshold_out=[0,10,50,100,max]
            var threshold_in=[0.01,0.5]
            var threshold_color=["#daafaf","#cc6666","#993333"]

            scaleColor=d3.scale.threshold()
                            .domain(threshold_in)
                            .range(threshold_color)
          }
          else{
            var color_domain=[]
            data.forEach(function(d){
              d.values.forEach(function(v){
                color_domain.push(v[colorBy])
              })
            })
            color_domain=d3.set(color_domain).values().sort(function(a, b){ return d3.descending(a, b)})
            categoryColor.domain(color_domain)
          }

        }
        function recolor(colorBy,data){
          // recolor_legend(colorBy,data)
          // if(scope.group) regroup(colorBy)
          updateColor(colorBy,data)
          d3.selectAll(".available")
            .style("fill",function(v){
              if(colorBy==="type"||colorBy==="continent"||colorBy==="sourcetype"|| colorBy==="reference") return categoryColor(v[colorBy])
              else if(colorBy==="mirror_rate") return v.mirror_rate!==undefined? scaleColor(v[colorBy]):"none"
              else return scaleColor(v[colorBy].length)
             })
             .style("opacity",function(v){
                if(colorBy==="partner" || colorBy==="mirror_rate") return 1
                else return 0.7
              })

        }
        function order(layout,data){
          switch(layout){
            case "years": data.sort(function(a, b){ return d3.descending(a.values.length, b.values.length)})
            break;
            case "partnerAvg":  data.sort(function(a, b){ return d3.descending(a.partnerAvg, b.partnerAvg)})
            break;
            case "flowAvg":  data.sort(function(a, b){ return d3.descending(a.flowAvg, b.flowAvg)})
            break;
            case "alphabet":  data.sort(function(a, b){ return d3.ascending(a.key, b.key)})
            break;
            case "continent":
             data.forEach(function(d){
              d.order=continentMap[d.values[0].continent]
             })
             data.sort(function(a, b) {
              if (a.order===b.order) return d3.descending(a.values.length, b.values.length)
              else return d3.ascending(a.order, b.order)
             })
            break;
            case "type":
             data.forEach(function(d){
              d.order=typeMap[d.values[0].type]
             })
             data.sort(function(a, b) {
              if (a.order===b.order) return d3.descending(a.values.length, b.values.length)
              else return d3.ascending(a.order, b.order)
              })
            break;
          }
          return data;
        }
        function reorder(data){
          var reportings=data.map(function(d){ return d.key; })
          y.domain(reportings);
          marginScale.domain([0,d3.max(data,function(d){return d[layout]})])
          d3.select(".margin.axis").call(marginAxis);
          d3.select(".margin.axis").select("text").text(layoutName)

          d3.select("#reporting-entities-container").selectAll(".entities")
            .transition().duration(500)
            .attr("transform", function(d){ return "translate(0 ,"+ y(d.key) + ")"})
          d3.select("#reporting-entities-container").selectAll(".entities").selectAll(".coverage_rect")
             .attr("x",function(d){ return marginScale(d[layout])})
             .attr("width",function(d){ return margin.left-offset-marginScale(d[layout])})
        }
        function draw(data){
          data=order(layout,data);
          updateColor(colorBy,data)
          marginScale.domain([0,d3.max(data,function(d){return d[layout]})])

          // var nbReporting=d3.nest()
          //                    .key(function(d) { return d.year; })
          //                    .rollup(function(v) { return {
          //                       nb_reporting:v.length
          //                       }
          //                     })
          //                    .entries(scope.flatData);

          var minDate=d3.min(scope.flatData,function(d){return +d.year});
          var maxDate=d3.max(scope.flatData,function(d){return +d.year});

          var years=d3.range(minDate,maxDate)

          var reportings=data.map(function(d){
            return d.key;
          })


          height=gridHeight*reportings.length;

          d3.select(".margin.axis").call(marginAxis);
          svg_g.selectAll("g").remove();

          // nb_height=5*d3.max(nbReporting,function(d){return d.values.nb_reporting})

          var svg =svg_g.attr("width",width + margin.left + margin.right)
                    .attr("height",height+margin.top+margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          // var max=d3.max(data,function(d){return d3.max(d.values,function(v){return +v.flow})});
          // var min=d3.min(data,function(d){return d3.min(d.values,function(v){return +v.flow})});

          x.domain([new Date(minDate,0,1),new Date(maxDate,0,1)]);
          y.domain(reportings)
            .rangeRoundBands([0, height])

          // recolor_legend(colorBy,data)

          // numScale.domain([0,d3.max(nbReporting,function(d){return d.values.nb_reporting})])
          //         .range([0,nb_height])

        var matrix=svg.append("g")
                     .attr("class", "matrix")
                     .attr("transform", "translate(0 ,"+ gridGap + ")");

        matrix.append("g")
              .attr("class", "num axis")
              .style("opacity",0)
              .call(numAxis)

        var entity=matrix.append("g")
                      .selectAll(".entities")
                      .data(data)
                      .enter().append("g")
                      .attr("class","entities")
                      .attr("id",function(d){return "r_"+d.values[0].reporting_id;})
                      .attr("transform", function(d){ return "translate(0 ,"+ y(d.key) + ")"});

         entity.on("mouseover",function(d){
                  if(!searchFixed){
                    d3.select(this).selectAll(".overlay,.rlabel").style("stroke","black");
                  }
                })
                .on("mouseout",function(d){
                  if(!searchFixed){
                    d3.select(this).selectAll(".overlay,.rlabel").style("stroke","none");
                  }
                })
          //       .on("click",function(d){
          //         // var fixClass = "fixed";
          //         // var alreadyIsFix = d3.select(this).selectAll(".overlay,.rlabel").classed(fixClass);
          //         // d3.selectAll(".overlay,.rlabel").classed(fixClass, false);
          //         // d3.select(this).selectAll(".overlay,.rlabel").classed(fixClass, !alreadyIsFix);
          //         // searchFixed=!searchFixed;
          //       })
          entity.each(function(d){
              var e = d3.select(this);
              //emptycell
              e.append("g").selectAll("rect")
                .data(years)
                .enter().append("rect")
                .attr("x", function(d) { return x(new Date(d,0,1));})
                .attr("width", gridWidth-gridGap)
                .attr("height", gridHeight-gridGap )
                .style("fill", "lightgrey")
              e.append("rect")
                .attr("class","overlay")
                .attr("width",width)
                .attr("height",gridHeight-gridGap)
                .style("fill","none")
                .style("pointer-events","all")

              e.append("g")
               .selectAll("rect")
               .data(d.values)
               .enter().append("rect")
               .attr("class","available")
               .attr("x", function(v) { return x(new Date(v.year,0,1));})
               .attr("y",function(d){return y(d.key)})
               .attr("width", gridWidth-gridGap)
               .attr("height", gridHeight-gridGap )
               .style("fill",function(v){
                  if(colorBy==="type"||colorBy==="continent"||colorBy==="sourcetype"|| colorBy==="reference") return categoryColor(v[colorBy])
                  else return scaleColor(v[colorBy].length)
                 })
                .style("opacity",function(){
                  if(colorBy==="partner" || colorBy==="mirror_rate") return 1
                  else return 0.7
                })
               // .style("fill",function(v){return sourceColors[v.sourcetype]})
               // .style("fill", function(v) {return continentColors[v.continent];})
               // .style("fill-opacity",function(v){return z(v[yValue]);})
               .on('mouseover', function(v) {
                  var partner=v.partnertype==="actual" ? "Actual Reported": v.reference;
                  var bilateral=v.partnertype==="actual"? "Number of bilateral partners: "+v.mirror_rate : ""
                  var reference=v.partnertype==="actual"? "Number of partners by continent":"World Partner reference: " + v.reference
                  d3.select(this).style("stroke","black");
                  // d3.select(this.parentNode.parentNode).select("text").style("stroke","black");
                  // d3.select(".matrix").append("rect")
                  //                   .attr("class","column")
                  //                   .attr("x",x(new Date(v.year,0,1)))
                  //                   .attr("height",height)
                  //                   .attr("width",gridWidth-gridGap)
                  //                   .style("fill","none")
                  //                   .style("stroke","black");
                  tooltip.transition().style("display","block").style("opacity",.9);
                  tooltip.select(".title").html(
                    "<h5>"+v.reporting +" ("+v.type.split("/")[0]+" in "+v.continent+")"+ " in " + v.year +"</h5><hr>"+
                    "<p style='font-weight:bold'>Partner Type: "+v.reference+"</p>")
                  tooltip.select(".source").html(
                    "<div><span style='font-weight:bold'>Source("+v.sourcetype+"):</span>"+v.source+"</div>"
                  )
                  tooltip.select(".tip_svg").style("display","none");
                  tooltip.select(".table").style("display","none");
                  if(colorBy==="partner") {
                    tooltip.select(".tip_svg").style("display","block");
                    tooltip.select(".tip_svg").selectAll("*").remove()

                    if(v.partnertype==="actual"){
                      tooltip.select(".tip_svg").html("<p>Number of partners: "+v.partner.length+"</p><p>By continent:</p>")
                      tooltip.select(".tip_svg").append("svg")
                                 .attr("width",tip_width)
                                 .attr("height",20*v.partner_continent.length+tip_margin.top+tip_margin.bottom+20)
                                 .append("g")
                                 .attr("class","tip_group")
                                 .attr("transform", "translate(" + tip_margin.left + "," + tip_margin.top + ")");
                      x_tip.domain([0,d3.max(v.partner_continent,function(d){return d.number})])

                      // y_tip.domain(v.partner_continent.map(function(d){return d.continent}))
                      var tip_partner=tooltip.select(".tip_group")
                             .selectAll(".tip_partner")
                             .data(v.partner_continent)
                             .enter().append("g")
                             .attr("class","tip_partner")
                             .attr("transform",function(d,i){
                                return "translate(0,"+2*i*(gridHeight+2)+")"})
                      tip_partner.append("rect")
                                 .attr("width",function(d){return x_tip(d.number)})
                                 .attr("height",10)
                                 .attr("fill",function(d){return continentColors[d.continent]});
                      tip_partner.append("text")
                                 .text(function(d){return d.continent})
                                 .attr("class","continentLabel")
                                 .attr("y",-2)
                                 .attr("fill","#fff")
                                 .attr("font-size",11)
                      tip_partner.append("text")
                                 .text(function(d){return d.number})
                                 .attr("x",function(d){return x_tip(d.number)+2})
                                 .attr("y",9)
                                 .attr("text-anchor","start")
                                 .attr("fill","#fff")
                                 .attr("font-size",12)
                      }
                    }
                    else if(colorBy==="mirror_rate") {
                      tooltip.select(".table").style("display","block");
                      tooltip.select(".table").select("table").remove();
                      tooltip.select(".table").html("<table><tr><td>Number of Partners</td><td style='text-align:right'>"
                        +v.partner.length+"</td></tr><tr><td>Number of Bilateral Partners</td><td style='text-align:right'>"
                        +v.partner_intersect.length+"</td></tr><tr><td>Bilateral Rate</td><td style='text-align:right'>"
                        +d3.round(v.mirror_rate,2)+"</td></tr></table>")
                      // var table = tooltip.select(".table").append("table")
                      // var tr = table.selectAll(".row").data(selectBar).enter().append("tr").attr("class","row");
                      // // create the first column for each segment.
                      // tr.append("td").append("svg").attr("width", '6').attr("height", '6').append("rect")
                      //   .attr("width", '6').attr("height", '6')
                      //   .attr("fill",function(d){
                      //       if(d.key!=="Total") return category==="partner"||category==="mirror_rate"? scaleColor(d.key):categoryColor(d.key)
                      //       else return "none"
                      //   })

                      // // create the second column for each segment.
                      // tr.append("td").text(function(d){
                      //   if (category==="partner" && d.key!=="Total") return partner_map[d.key];
                      //   else if(category==="mirror_rate" && d.key!=="Total") return mirror_map[d.key];
                      //   else return d.key;
                      // })

                      // // create the third column for each segment.
                      // tr.append("td").text(function(d){ return d.value}).style("text-align","right");
                    }
                })
                .on('mouseout', function() {
                  d3.select(this).style("stroke","none");
                  // d3.select(this.parentNode.parentNode).select("text").style("stroke","none");
                  // d3.select(".matix").select(".column").remove();
                  tooltip.transition().style("display", 'none');
                  svg_axis.selectAll(".highlight").remove();
                })
                .on('mousemove', function() {
                    var hid = tooltip.style("height").replace("px", "");

                    tooltip.style("display","block").style("left", (Math.min(window.innerWidth,
                        Math.max(0, (d3.event.pageX)))-75) + "px")
                    .style("top",(d3.event.pageY+40)+"px")
                      // .style("width", wid + "px");

                    //  //tick highlighting
                    // var text = svg_axis.append("text")
                    //        .attr("class", "highlight")
                    //        .attr("x", x(new Date(d.year,0,1)))
                    //        .attr("y", -9)
                    //        .attr("font-size", "0.85em")
                    //        .attr("text-anchor","middle")
                    //        .text(d.year);

                    // // Define the gradient
                    // var gradient = svg_axis.append("svg:defs")
                    //       .append("svg:linearGradient")
                    //       .attr("id", "gradient")
                    //       .attr("x1", "0%")
                    //       .attr("y1", "100%")
                    //       .attr("x2", "100%")
                    //       .attr("y2", "100%")
                    //       .attr("spreadMethod", "pad");

                    //   // Define the gradient colors
                    //   gradient.append("svg:stop")
                    //       .attr("offset", "0%")
                    //       .attr("stop-color", "#f5f5f5")
                    //       .attr("stop-opacity", 0.1);

                    //   gradient.append("svg:stop")
                    //       .attr("offset", "50%")
                    //       .attr("stop-color", "#f5f5f5")
                    //       .attr("stop-opacity", 1);

                    //   gradient.append("svg:stop")
                    //       .attr("offset", "100%")
                    //       .attr("stop-color", "#f5f5f5")
                    //       .attr("stop-opacity", 0.1);

                    //   // add rect as background to hide date display in
                    //   var bbox = text.node().getBBox();
                    //   var rect = svg_axis.append("svg:rect")
                    //       .attr("class", "highlight")
                    //       .attr("x", bbox.x-20)
                    //       .attr("y", bbox.y)
                    //       .attr("width", bbox.width+40)
                    //       .attr("height", bbox.height)
                    //       .style("fill", 'url(#gradient)')
                    //   svg_axis.append("text")
                    //        .attr("class", "highlight")
                    //        .attr("x", x(new Date(d.year,0,1)))
                    //        .attr("y", -9)
                    //        .attr("font-size", "0.85em")
                    //        .attr("text-anchor","middle")
                    //        .text(d.year);
                });

              // z.domain(d3.extent(d.values,function(v){ return  +v[yValue];}));
              var sideChart=e.append('g')
                               .attr("transform", "translate(-" + (2+margin.left-offset) + ",0)")

              sideChart.append("rect")
                  .attr("class","coverage_rect")
                  .attr("x",function(d){ return marginScale(d[layout])})
                  .attr("width",function(d){ return margin.left-offset-marginScale(d[layout])})
                  .attr("height",gridHeight-gridGap)
                  .style("opacity",0.7)
                  .style("fill","lightgrey")

              sideChart.append("text")
                         .attr("class","barLabel")
                         .attr("y",8)
                         .attr("font-size",11)
                         .style("stroke","black")
                         .style("opacity",0)

                e.append("text")
                  .text(function(d){
                    if(d.key.split("(")[0].length>23) return d.key.split("(")[0].substring(0,20)+"...";
                    else return d.key.split("(")[0];
                  })
                  .attr("class","rlabel")
                  .attr("text-anchor","end")
                  .attr("x",-2)
                  .attr("y",8)
                  .attr("font-size",11)
                  .attr("cursor","default")
                  .on("mouseover",function(d){
                    d3.select(this.parentNode.parentNode).selectAll(".rlabel").style("opacity",0)
                    d3.select(this.parentNode).selectAll(".coverage_rect,.barLabel")
                                              .style("opacity",1)
                    d3.select(this.parentNode).select(".barLabel")
                      .attr("x",function(d){ return marginScale(d[layout])})
                      .attr("text-anchor",function(d){
                                      return marginScale(d[layout])>margin.left/2 ? "end":"start"
                      })
                      .text(valueFormat(d[layout]))
                    tooltip_margin.style("opacity", .9).html(
                    "<h5>"+d.key +"</h5><hr>"+layoutName+": "+d[layout])
                  })
                  .on('mousemove', function(v) {
                    tooltip_margin
                    // var wid = tooltip.style("width").replace("px", "");
                    .style("left", (Math.min(window.innerWidth,
                        Math.max(0, (d3.event.pageX)))) + "px")
                    // .style("left",(margin.left-offset)/2+"px")
                    .style("top", (d3.event.pageY+40) + "px")
                      // .style("width", wid + "px");
                  })
                  .on("mouseout",function(d){
                    tooltip_margin.style("opacity",0)
                   d3.select(this.parentNode.parentNode).selectAll(".rlabel").style("opacity",1)
                    d3.select(this.parentNode).select(".coverage_rect")
                                              .style("opacity",0.7)
                    d3.select(this.parentNode).select(".barLabel")
                                              .style("opacity",0)
                    // if(d.key.split("(")[0].length>23){
                    //   d3.select(this).text(function(d){return d.key.split("(")[0].substring(0,20)+"..."})
                    //                  .attr("x",0)
                    //                  .attr("text-anchor","end")
                    // }
                  })
            })//end draw entity group

            // matrix.append("g").attr("class","availableGroup")
            //    .selectAll("rect")
            //    .data(scope.flatData)
            //    .enter().append("rect")
            //    .attr("class","available")
            //    .attr("x", function(d) { return x(new Date(d.year,0,1));})
            //    .attr("y",function(d){return y(d.reporting)})
            //    .attr("width", gridWidth-gridGap)
            //    .attr("height", gridHeight-gridGap )
            //    .style("fill",function(d){
            //       if(colorBy==="type"||colorBy==="continent"||colorBy==="sourcetype"|| colorBy==="reference") return categoryColor(d[colorBy])
            //       else return scaleColor(d[colorBy].length)
            //      })
            //     .style("opacity",function(v){
            //       if(colorBy==="partner" || colorBy==="flow") return 1
            //       else return 0.8
            //     })
            //    // .style("fill",function(v){return sourceColors[v.sourcetype]})
            //    // .style("fill", function(v) {return continentColors[v.continent];})
            //    // .style("fill-opacity",function(v){return z(v[yValue]);})
            //    .on('mouseover', function(d) {
            //       var partner=d.partnertype==="actual" ? "Number of partners: "+d.partner.length : "World Partner: "+d.partner
            //       var bilateral= d.partner_mirror!==undefined ? d.partner_mirror.length: 0
            //       var reference=d.partnertype==="actual"?  "Number of partners by continent":"World Partner reference: " + d.reference
            //       d3.select(this).style("stroke","black");
            //       // d3.select(this.parentNode.parentNode).select("text").style("stroke","black");
            //       // d3.select(".matrix").append("rect")
            //       //                   .attr("class","column")
            //       //                   .attr("x",x(new Date(v.year,0,1)))
            //       //                   .attr("height",height)
            //       //                   .attr("width",gridWidth-gridGap)
            //       //                   .style("fill","none")
            //       //                   .style("stroke","black");
            //       tooltip.select(".title").html(
            //         "<h5>"+d.reporting +" ("+d.type.split("/")[0]+" in "+d.continent+")"+ " in " + d.year +"<hr>"+
            //          "<p>"+partner+"</p>"+"<p>Number of bilateral partners:" +bilateral+"</p>"
            //       )
            //       tooltip.select(".source").html(
            //         "<hr><div><span style='font-weight:bold'>Source("+d.sourcetype+"):</span>"+d.source+"</div>"
            //       )
            //       tooltip.transition().style("opacity", .9);

            //       tooltip.select(".tip_svg").select("svg").remove()

            //       if(d.partnertype==="actual"){
            //         tooltip.select(".tip_svg").append("svg")
            //                    .attr("width",tip_width)
            //                    .attr("height",20*d.partner_continent.length+tip_margin.top+tip_margin.bottom+20)
            //                    .append("g")
            //                    .attr("class","tip_group")
            //                    .attr("transform", "translate(" + tip_margin.left + "," + tip_margin.top + ")");
            //         x_tip.domain([0,d3.max(d.partner_continent,function(d){return d.number})])

            //         // y_tip.domain(v.partner_continent.map(function(d){return d.continent}))
            //         var tip_partner=tooltip.select(".tip_group")
            //                .selectAll(".tip_partner")
            //                .data(d.partner_continent)
            //                .enter().append("g")
            //                .attr("class","tip_partner")
            //                .attr("transform",function(d,i){
            //                   return "translate(0,"+2*i*(gridHeight+2)+")"})
            //         tip_partner.append("rect")
            //                    .attr("width",function(d){return x_tip(d.number)})
            //                    .attr("height",10)
            //                    .attr("fill",function(d){return continentColors[d.continent]});
            //         tip_partner.append("text")
            //                    .text(function(d){return d.continent})
            //                    .attr("class","continentLabel")
            //                    .attr("y",-2)
            //                    .attr("fill","#fff")
            //                    .attr("font-size",11)
            //         tip_partner.append("text")
            //                    .text(function(d){return d.number})
            //                    .attr("x",function(d){return x_tip(d.number)+2})
            //                    .attr("y",9)
            //                    .attr("text-anchor","start")
            //                    .attr("fill","#fff")
            //                    .attr("font-size",12)
            //       }

            //     })
            //     .on('mouseout', function(d) {
            //       d3.select(this).style("stroke","none");
            //       // d3.select(this.parentNode.parentNode).select("text").style("stroke","none");
            //       // d3.select(".matrix").select(".column").remove();
            //       tooltip.transition().style("opacity", 0);
            //       svg_axis.selectAll(".highlight").remove();
            //     })
            //     .on('mousemove', function(d) {
            //         tooltip.style("opacity", .9)
            //         // var wid = tooltip.style("width").replace("px", "");
            //         .style("left", (Math.min(window.innerWidth,
            //             Math.max(0, (d3.event.pageX)))-75) + "px")
            //         .style("top", (d3.event.pageY +40) + "px")
            //           // .style("width", wid + "px");

            //         //  //tick highlighting
            //         // var text = svg_axis.append("text")
            //         //        .attr("class", "highlight")
            //         //        .attr("x", x(new Date(d.year,0,1)))
            //         //        .attr("y", -9)
            //         //        .attr("font-size", "0.85em")
            //         //        .attr("text-anchor","middle")
            //         //        .text(d.year);

            //         // // Define the gradient
            //         // var gradient = svg_axis.append("svg:defs")
            //         //       .append("svg:linearGradient")
            //         //       .attr("id", "gradient")
            //         //       .attr("x1", "0%")
            //         //       .attr("y1", "100%")
            //         //       .attr("x2", "100%")
            //         //       .attr("y2", "100%")
            //         //       .attr("spreadMethod", "pad");

            //         //   // Define the gradient colors
            //         //   gradient.append("svg:stop")
            //         //       .attr("offset", "0%")
            //         //       .attr("stop-color", "#f5f5f5")
            //         //       .attr("stop-opacity", 0.1);

            //         //   gradient.append("svg:stop")
            //         //       .attr("offset", "50%")
            //         //       .attr("stop-color", "#f5f5f5")
            //         //       .attr("stop-opacity", 1);

            //         //   gradient.append("svg:stop")
            //         //       .attr("offset", "100%")
            //         //       .attr("stop-color", "#f5f5f5")
            //         //       .attr("stop-opacity", 0.1);

            //         //   // add rect as background to hide date display in
            //         //   var bbox = text.node().getBBox();
            //         //   var rect = svg_axis.append("svg:rect")
            //         //       .attr("class", "highlight")
            //         //       .attr("x", bbox.x-20)
            //         //       .attr("y", bbox.y)
            //         //       .attr("width", bbox.width+40)
            //         //       .attr("height", bbox.height)
            //         //       .style("fill", 'url(#gradient)')
            //         //   svg_axis.append("text")
            //         //        .attr("class", "highlight")
            //         //        .attr("x", x(new Date(d.year,0,1)))
            //         //        .attr("y", -9)
            //         //        .attr("font-size", "0.85em")
            //         //        .attr("text-anchor","middle")
            //         //        .text(d.year);
            //     });
          }
      }
  }
}])