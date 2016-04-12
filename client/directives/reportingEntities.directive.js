'use strict';
/* Directives */
angular.module('ricardo.directives.reportingEntities', [])

  /* directive with watch, update and draw functions */
  .directive('reportingEntities', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-entities-axis"></div><div id="reporting-entities-container"></div>',
      scope: {
          ngData: '=',
          flowType:"=",
          layout: "=",
          color: "=",
          reporting:"=",
          search:"="
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue && newValue!==oldValue){
              draw(newValue);
            }
        });

        // scope.$watch('flowType', function(newValue, oldValue) {
        //   if ( newValue!==oldValue && scope.ngData ) {
        //     yValue=newValue.type.value;
        //     yName=newValue.name.value;
        //     draw(scope.ngData);
        //   }
        // })

        scope.$watch('layout', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            layout=newValue.type.value;
            // console.log(layout)
            var data=order(layout,scope.ngData);
            reorder(data);
          }
        })
        scope.$watch('color', function(newValue, oldValue) {
          if ( newValue!==oldValue) {
            colorBy=newValue.type.value;
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
        var sourceColors = {
                    "primary":"lightblue",
                    "secondary":"lightgrey",
                    "estimation":"grey"
                    }
        var typeScale=d3.scale.category10();
        function colorByContinent(continent) {
          return continentColors[continent]
        }


        // var yValue=scope.flowType.type.value;
        // var yName=scope.flowType.name.value;
        var yValue="total_partner"
        var yName="Partners"
        var layout=scope.layout.type.value;
        var colorBy=scope.color.type.value;

        var margin = {top: 0, right: 0, bottom: 40, left: 180},
            width = document.querySelector('#reporting-entities-container').offsetWidth-margin.left-margin.right,
            height,
            // offset=30,
            orders

        var z=d3.scale.linear().range([0.2,1])
        var gridHeight=10,
            gridGap=1

        var legendWidth=50

        var x = d3.time.scale()
                .range([0, width])
                .domain([new Date(1786,0,1),new Date(1938,0,1)]);

        var y = d3.scale.ordinal()

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .ticks(10);
        var margin_axis = {top: 45, right: 0, bottom: 40, left: 180}
        var svg_axis = d3.select("#reporting-entities-axis").append("svg")
            .attr("width",width + margin.left + margin.right)
            .attr("height",50)
            .append("g")
            .attr("transform", "translate(" + margin_axis.left + ","+margin_axis.top+")");
         svg_axis.append("g")
                .attr("class", "x axis")
                .call(xAxis);

//////////////////////////////////////////////////////
////////////////// Tooltips Setup //////////////////
//////////////////////////////////////////////////////
        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "matrix-tooltip")
                      .style("width", "200px")


        var tip_margin = {top: 10, right: 0, bottom: 10, left:0},
            tip_width = document.querySelector('.matrix-tooltip').offsetWidth-tip_margin.left-tip_margin.right
            // tip_height= document.querySelector('.matrix-tooltip').offsetHeight-tip_margin.top-tip_margin.bottom
        tooltip.append("div").attr("class", "title");
        tooltip.append("div").attr("class","tip_svg")

        tooltip.append("div").attr("class","source")
        // var tip_max=d3.max(data,function(d){
        //   return d3.max(d.values,function(v){
        //     return d3.max(v.exp_continent,function(n){
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

        function order(layout,data){
          switch(layout){
            case "years": data.sort(function(a, b){ return d3.descending(a.values.length, b.values.length)})
            break;
            case "partner_avg":  data.sort(function(a, b){ return d3.descending(a.partnerAvg, b.partnerAvg)})
            break;
            case "flow_avg":  data.sort(function(a, b){ return d3.descending(a.flowAvg, b.flowAvg)})
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

          d3.select("#reporting-entities-container").selectAll(".entities")
            .transition().duration(500)
            .attr("transform", function(d){ return "translate(0 ,"+ y(d.key) + ")"})
          d3.select("#reporting-entities-container").selectAll(".entities").selectAll(".coverage_rect")
            .attr("x",function(d){
                if(layout==="years") return -d.values.length-2;
                if(layout==="flow_avg") return -d.flowAvg-2;
                if(layout==="partner_avg") return -d.partnerAvg-2;
             })
             .attr("height",gridHeight-gridGap)
             .attr("width",function(d){
                if(layout==="years") return d.values.length;
                if(layout==="flow_avg") return d.flowAvg;
                if(layout==="partner_avg") return d.partnerAvg;
             })
          // d3.select(".matrix").selectAll(".sideLabel").remove();
          // if(layout==="continent" || layout==="type"){
          //   if (layout==="continent") var count=countByContinent;
          //   else var count=countByType
          //   var sideLabel=d3.select(".matrix").append("g")
          //                 .selectAll(".sideLabel")
          //                 .data(count).enter().append("g")
          //                 .attr("class","sideLabel")
          //                 .attr("transform", function(d){return "translate(-"+(margin.left)+","+d.y0*gridHeight+")";})
          //   sideLabel.append("rect")
          //            .attr("width",offset)
          //            .attr("height",function(d){return d.number*gridHeight})
          //            .style("fill",function(d){
          //             if(layout==="continent") return continentColors[d.label];
          //             if(layout==="type") return typeScale(d.label);
          //            })
          //   sideLabel.append("text")
          //                 .attr("y",20)
          //                 .attr("x",-5)
          //                 .text(function(d){return d.label;})
          //                 .attr("text-anchor","end")
          //                 .attr("transform","rotate(270)")
          // }
        }
        function draw(data){
          data=order(layout,data);
          // if(colorBy==="partners"){
          //   var partner_continent=[]
          //   var type=d3.set(data.map(function(d){return d.values[0].type})).values();

          //   data.forEach(function(d){
          //     d.values.forEach(function(v){
          //       v.exp_continent.forEach(function(e){
          //         partner_continent.push(e.continent)
          //       })
          //     })
          //   })
          //   typeScale.domain(type);
          //   partner_continent=d3.set(partner_continent).values();
          // }

          //Count by countinent/type
          // var countType=data.map(function(d){return d.values[0].type;})
          // var countContinent=data.map(function(d){return d.values[0].continent;})
          // countType=d3.nest()
          //           .key(function(d){return d})
          //           .rollup(function(values) { return values.length; })
          //           .map(countType)
          // countContinent=d3.nest()
          //           .key(function(d){return d})
          //           .rollup(function(values) { return values.length; })
          //           .map(countContinent)
          // d3.keys(countType).forEach(function(d){
          //       countByType.push({
          //         "label":d,
          //         "number":countType[d]
          //       })
          // })
          // d3.keys(countContinent).forEach(function(d){
          //     countByContinent.push({
          //       "label":d,
          //       "number":countContinent[d]
          //     })
          // })
          // countByType.sort(function(a,b){return b.number-a.number})
          // countByContinent.sort(function(a,b){return b.number-a.number})
          // var y0=0
          // countByType.forEach(function(d){
          //   d.y0=y0
          //   d.y1=d.y0+d.number
          //   y0+=d.number
          // })
          // y0=0
          // countByContinent.forEach(function(d){
          //   d.y0=y0
          //   d.y1=d.y0+d.number
          //   y0+=d.number
          // })




          d3.select("#reporting-entities-container").select("svg").remove();

          var reportings=data.map(function(d){
            return d.key;
          })

          var years=d3.range(1786,1938)
          years=d3.set(years).values();

          //map reportings array to object
          // var reporting_map={}
          // reportings.forEach(function(d,i){ reporting_map[d]=i });

          height=gridHeight*reportings.length;

          var svg = d3.select("#reporting-entities-container").append("svg")
                    .attr("width",width + margin.left + margin.right)
                    .attr("height",height+margin.top+margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          var max=d3.max(data,function(d){return d3.max(d.values,function(v){return +v[yValue]})});
          var min=d3.min(data,function(d){return d3.min(d.values,function(v){return +v[yValue]})});


          // var colorScale = d3.scale.linear()
          //                 .domain([min, max])
          //                 .range(["#3E9583", "#1F2D86"])
          var colorScale=d3.scale.threshold()
                            .domain([d3.round(max/15),d3.round(max/4),d3.round(max*2/3)])
                            .range(["#daafaf","#cc6666","#993333","#663333"])

          // x.domain([new Date(1786,0,1),new Date(1938,0,1)]);


          y.domain(reportings)
            .rangeRoundBands([0, height])

          z.domain([min,max]);

          var gridWidth=width/(1938-1786);

          var legendData=[
                {"label":"N/A",
                  "value":"lightgrey"
                },
                {"label":"<"+d3.round(max/10),
                  "value":"#daafaf"
                },
                {"label":d3.round(max/10)+"-"+(+d3.round(max/4)+2),
                  "value":"#cc6666"
                },
                {"label":(+d3.round(max/4)+2)+"-"+(+d3.round(max*2/3)-2),
                  "value":"#993333"
                },
                {"label":">"+(+d3.round(max*2/3)-2),
                  "value":"#663333"
                },
          ]

          var legend=svg_axis.append("g")
                     .attr("class",legend)
                     .attr("transform", "translate("+(width-legendWidth*5)+",-"+(margin_axis.top*2/3)+")");

          legend.append("text")
                .text("Number of Partners")
                .attr("x",-5)
                .attr("y",6)
                .attr("font-size",11)
                .attr("text-anchor","end")

          var legend_g=legend.selectAll("legend")
                .data(legendData)
                .enter().append("g")
                .attr("transform", function(d,i){return "translate("+i*legendWidth+",0)"});

          legend_g.append("rect")
                .attr("y", 0)
                .attr("width", legendWidth)
                .attr("height", 10)
                .style("fill", function(d){return d.value;})

          legend_g.append("text")
                  .text(function(d){return d.label})
                  .attr("text-anchor","start")
                  .attr("y",-5)
                  .attr("font-size",11)

          var vis=document.querySelector("#reporting-entities-container");
          vis.addEventListener('scroll', function(evt) {
              svg.select(".x.axis")
                  .attr('transform', "translate(0,"+(this.scrollTop-margin.top+10)+")");
          }, false)

          var matrix=svg.append("g")
                     .attr("class", "matrix")
                     .attr("transform", "translate(0 ,"+ gridGap + ")");

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


              // z.domain(d3.extent(d.values,function(v){ return  +v[yValue];}));
              e.append("g").selectAll("rect")
               .data(d.values)
               .enter().append("rect")
               .attr("class","available")
               .attr("x", function(v) { return x(new Date(v.year,0,1));})
               .attr("width", gridWidth-gridGap)
               .attr("height", gridHeight-gridGap )
               .style("fill",function(v){return colorScale(v[yValue])})
               // .style("fill",function(v){return sourceColors[v.sourcetype]})
               // .style("fill", function(v) {return continentColors[v.continent];})
               // .style("fill-opacity",function(v){return z(v[yValue]);})
               .on('mouseover', function(v) {
                  d3.select(this).style("stroke","black");
                  // d3.select(this.parentNode.parentNode).select("text").style("stroke","black");
                  // d3.select(".matrix").append("rect")
                  //                   .attr("class","column")
                  //                   .attr("x",x(new Date(v.year,0,1)))
                  //                   .attr("height",height)
                  //                   .attr("width",gridWidth-gridGap)
                  //                   .style("fill","none")
                  //                   .style("stroke","black");
                  tooltip.select(".title").html(
                    "<h5>"+d.key +" ("+v.type.split("/")[0]+" in "+v.continent+")"+ " in " + v.year +"<p>"+yName+": " + v[yValue] + "</p></h5><hr>Partners by continent"
                    // "<p>"+yName+": " + v[yValue] + "</p>"
                  )
                  tooltip.select(".source").html(
                    "<hr><div style='background-color:"+sourceColors[v.sourcetype]+"'><span style='font-weight:bold'>Source("+v.sourcetype+"):</span>"+v.source+"</div>"
                  )
                  tooltip.transition().style("opacity", .9);
                  if(colorBy==="partners"){
                    tooltip.select(".tip_svg").select("svg").remove()
                    tooltip.select(".tip_svg").append("svg")
                               .attr("width",tip_width)
                               .attr("height",20*v.exp_continent.length+tip_margin.top+tip_margin.bottom+20)
                               .append("g")
                               .attr("class","tip_group")
                               .attr("transform", "translate(" + tip_margin.left + "," + tip_margin.top + ")");
                    x_tip.domain([0,d3.max(v.exp_continent,function(d){return d.number})])

                    // y_tip.domain(v.exp_continent.map(function(d){return d.continent}))
                    var tip_partner=tooltip.select(".tip_group")
                           .selectAll(".tip_partner")
                           .data(v.exp_continent)
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

                })
                .on('mouseout', function(v) {
                  d3.select(this).style("stroke","none");
                  // d3.select(this.parentNode.parentNode).select("text").style("stroke","none");
                  // d3.select(".matrix").select(".column").remove();
                  tooltip.transition().style("opacity", 0);
                  svg_axis.selectAll(".highlight").remove();
                })
                .on('mousemove', function(v) {
                    tooltip.style("opacity", .9)
                    // var wid = tooltip.style("width").replace("px", "");
                    .style("left", (Math.min(window.innerWidth,
                        Math.max(0, (d3.event.pageX)))-75) + "px")
                    .style("top", (d3.event.pageY +40) + "px")
                      // .style("width", wid + "px");

                     //tick highlighting
                    var text = svg_axis.append("text")
                           .attr("class", "highlight")
                           .attr("x", x(new Date(v.year,0,1)))
                           .attr("y", -9)
                           .attr("font-size", "0.85em")
                           .attr("text-anchor","middle")
                           .text(v.year);

                    // Define the gradient
                    var gradient = svg_axis.append("svg:defs")
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
                      var rect = svg_axis.append("svg:rect")
                          .attr("class", "highlight")
                          .attr("x", bbox.x-20)
                          .attr("y", bbox.y)
                          .attr("width", bbox.width+40)
                          .attr("height", bbox.height)
                          .style("fill", 'url(#gradient)')
                      svg_axis.append("text")
                           .attr("class", "highlight")
                           .attr("x", x(new Date(v.year,0,1)))
                           .attr("y", -9)
                           .attr("font-size", "0.85em")
                           .attr("text-anchor","middle")
                           .text(v.year);
                });
                e.append("rect")
                  .attr("class","coverage_rect")
                  .attr("x",function(d){
                    if(layout==="years") return -d.values.length-2;
                    if(layout==="flow_avg") return -d.flowAvg-2;
                    if(layout==="partner_avg") return -d.partnerAvg-2;
                  })
                 .attr("height",gridHeight-gridGap)
                 .attr("width",function(d){
                    if(layout==="years") return d.values.length;
                    if(layout==="flow_avg") return d.flowAvg;
                    if(layout==="partner_avg") return d.partnerAvg;
                 })
                 .style("opacity",0.5)
                 .style("fill","#cc6666")

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
                    if(d.key.split("(")[0].length>23){
                      var textLength=this.getBBox();
                      d3.select(this).text(function(d){return d.key})
                                     .attr("x",-textLength.width)
                                     .attr("text-anchor","start")
                    }
                  })
                  .on("mouseout",function(d){
                    if(d.key.split("(")[0].length>23){
                      d3.select(this).text(function(d){return d.key.split("(")[0].substring(0,20)+"..."})
                                     .attr("x",0)
                                     .attr("text-anchor","end")
                    }
                  })

                // e.append("line")
                //   .attr("x1", -3)
                //   .attr("y1", 0)
                //   .attr("x2", -3)
                //   .attr("y2",10)
                //   .attr("stroke",function(d){return continentColors[d.values[0].continent];})

            })
          }
      }
  }
}])