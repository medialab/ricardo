'use strict';

/* Directives */
angular.module('ricardo.directives.numberFlows', [])
  /* directive with watch, update and draw functions */
  .directive('numberFlows', [function(){
    return {
      restrict: 'E',
      template: '<div id="number-flows-container"></div>',
      scope: {
        ngData: '=',
        flowType:'=',
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue){
              var data=group_flows(newValue)
            	draw(data);
            }
        });

        scope.$watch('flowType', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            yValue=newValue.type.value;
            yName=newValue.name.value;
          }
        })

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var color=d3.scale.ordinal()
                    .domain(["world","bilateral"]).range(["#75792f","#993333"])

        function group_flows(data){

          minDate=d3.min(data,function(d){return +d.year});
          maxDate=d3.max(data,function(d){return +d.year});

          var nbFlows=d3.nest()
                  .key(function(d) {return d.partner})
                  .entries(data);

          //extend missing points with null values
          nbFlows.forEach(function(d){
              for (var i = minDate; i<= maxDate;i++){
                var years=d.values.map(function(v){ return v.year});
                if (years.indexOf(i)=== -1){
                  d.values.push({
                    year:i,
                    partner:d.key,
                    nb_flows:0
                  })
                }
              }
              //sort by year ascending
              d.values.sort(function(a,b){
                return a.year-b.year;
              });
          })//add missing with 0
          return nbFlows.sort(function(a,b){ return d3.ascending(a.key,b.key)})
        }
        var margin = {top: 20, right: 10, bottom: 20, left: 20 },
            width = document.querySelector('#number-flows-container').offsetWidth-margin.left-margin.right,
            height=100,
            offsetHeight=10;

        var minDate,maxDate;
       
        var stack = d3.layout.stack()
                      .values(function(d) { return d.values; })
                      .x(function(d) { return x(new Date(+d.year,0,1)); })
                      .y(function(d) { return d.nb_flows; })
                  
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
            .style("opacity",function(d,i){return i===0 ?0:1})
            .attr("x",2)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }

        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "synth-tooltip")
                      .style("width", "160px")
        var tooltip_title=tooltip.append("div").attr("class", "title");
        var tooltip_table=tooltip.append("div").attr("class","table")
            
        var svg = d3.select("#number-flows-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        function draw(data) {

          var layers=stack(data)
          var barwidth=Math.floor(width/(maxDate-minDate))
          var maxReporting=d3.max(layers, function(d) {
            return d3.max(d.values,function(v){
              return v.y0+v.y
            })
          });

          x.domain([new Date(minDate,0,1), new Date(maxDate,0,1)]);
          y.domain([0,maxReporting])
          svg.selectAll("*").remove()    
          var indexIter=d3.range(0,154).map(function(d){return d*0;});
          var indexIterH=d3.range(0,154).map(function(d){return d*0;});

          var backbar=svg.append("g").selectAll(".background")
                      .data(d3.range(minDate,maxDate+1)).enter()
                      .append("rect")
                      .attr("class","background")
                      .attr("x", function(d) { return x(new Date(d,0,1))-barwidth/2; })
                      .attr("height",height)
                      .attr("width", barwidth-1)
                      .style("fill","lightgrey")
                      .style("opacity",0)
                      .attr("pointer-events","all")
                      .on("mouseover",function(d){
                        d3.select(this).style("opacity",1)
                        svg.selectAll('.layer').selectAll("rect").filter(function(layer){return layer.key===d}).style("opacity",1)
                        tooltip.transition().style("display", "block").style("opacity", .9);

                        var selectBar=data.reduce(function(a,b) { return a.values.concat(b.values);  })
                                          .filter(function(e) { return e.year ===d; });
                        
                        selectBar.sort(function(a,b){return b.nb_flows-a.nb_flows})

                        selectBar=selectBar.filter(function(d){return d.nb_flows!==0})
                        
                        selectBar.push({
                          partner:"total",
                          nb_flows: d3.sum(selectBar,function(d){return d.nb_flows})
                        })
                        tooltip_title.html("<h5>Number of "+yName+" Flows in "+d+"</h5")
                        // create table
                        // tooltip_table.html("<p>By "+categoryName+"</p>")
                        tooltip_table.select("table").remove()
                        var table = tooltip_table.append("table")
                        var tr = table.selectAll(".row").data(selectBar).enter().append("tr").attr("class","row");
                        // create the first column for each segment.
                        tr.append("td").append("svg").attr("width", '6').attr("height", '6').append("rect")
                          .attr("width", '6').attr("height", '6')
                          .attr("fill",function(d){ 
                            if(d.partner!=="total") return color(d.partner);
                            else return "none"
                          })

                        // create the second column for each segment.
                        tr.append("td").text(function(d){ return d.partner+" trade flows"})

                        // create the third column for each segment.
                        tr.append("td").text(function(d){ return d.nb_flows}).style("text-align","right");

                      })
                      .on("mousemove",function(d){
                        tooltip.style("left", d3.event.pageX+20 + "px")
                               .style("top", d3.event.pageY-100 + "px")
                        //  //tick highlighting
                        var text = svg.append("text")
                                 .attr("class", "highlight")
                                 .attr("x", x(new Date(d,0,1)))
                                 .attr("y", height+17)
                                 .attr("font-size", "0.85em")
                                 .attr("text-anchor","middle")
                                 .text(d);

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
                                .attr("x", bbox.x-20)
                                .attr("y", bbox.y)
                                .attr("width", bbox.width+40)
                                .attr("height", bbox.height)
                                .style("fill", 'url(#gradient)')
                            svg.append("text")
                                 .attr("class", "highlight")
                                 .attr("x", x(new Date(d,0,1)))
                                 .attr("y", height+17)
                                 .attr("font-size", "0.85em")
                                 .attr("text-anchor","middle")
                                 .text(d);
                      })
                      .on("mouseout",function(d){
                        d3.select(this).style("opacity",0)
                        svg.selectAll('.layer').selectAll("rect").style("opacity",0.7)
                        tooltip.transition().style("display", "none")
                        svg.selectAll(".highlight").remove();
                      })

          var layer = svg.selectAll(".layer")
              .data(layers)
              .enter().append("g")
              .attr("class", "layer")
              .style("fill",function(d){return color(d.key)})


          // layer.selectAll("rect")
          //     .data(function(d) { return d.values; })
          //     .enter().append("rect")
          //     .attr("x", function(d) {return x(new Date(d.year,0,1))-barwidth/2; })
          //     .attr("y", function(d) { return y(d.y + d.y0); })
          //     .attr("height", function(d) { return y(d.y0) - y(d.y + d.y0); })
          //     .attr("width", barwidth- 1);

          layer.each(function(data,index){
            var e=d3.select(this)
            e.selectAll("rect")
              .data(data.values)
              .enter().append("rect")
              .attr("x", function(d) {return x(new Date(d.year,0,1))-barwidth/2; })
              .attr("y", function(d,i) { 
                // return y(d.y + d.y0)
                if(index!==0 && layers[index-1].values[i].y===0) indexIter[i]+=1;
                if(d.y>0 && (y(d.y0) - y(d.y + d.y0))<2) indexIterH[i]+= 2-(y(d.y0) - y(d.y + d.y0));
                return y(d.y + d.y0)-2*(index-indexIter[i]) - indexIterH[i];
              })
              .attr("height", function(d) {
                if((y(d.y0) - y(d.y + d.y0))===0) return y(d.y0) - y(d.y + d.y0);
                else return d3.max([y(d.y0) - y(d.y + d.y0),2]);
               // return y(d.y0) - y(d.y + d.y0) 
              })
              .attr("width", barwidth-1)
              .style("opacity",0.7)
              .attr("pointer-events","none")
           })
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
      }//end of directive link function
    }//end of directive return function
  }])