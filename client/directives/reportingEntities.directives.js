'use strict';
/* Directives */
angular.module('ricardo.directives.reportingEntities', [])

  /* directive with watch, update and draw functions */
  .directive('reportingEntities', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-entities-container"></div>',
      scope: {
          ngData: '=',
          startDate: '=',
          endDate: '=',
          flowType: "=",
          layout: "="
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue && newValue!==oldValue){
              draw(newValue);
            }
        });

        scope.$watchCollection('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            // draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            // draw(scope.ngData)
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
            console.log(layout)
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


        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var layout=scope.layout.type.value;

        var margin = {top: 50, right: 0, bottom: 40, left: 200},
            width = document.querySelector('#reporting-entities-container').offsetWidth-margin.left-margin.right,
            height

        var gridHeight=10,
            gridGap=1

        var x = d3.scale.linear()
              .range([0, width]);

        var y = d3.scale.linear()

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .ticks(10);

        var tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "matrix-tooltip");
        function draw(data){

          d3.select("#reporting-entities-container").select("svg").remove();

          if(layout==="coverage"){
              data.sort(function(a, b){
                  return d3.descending(a.values.length, b.values.length)
              })
          }
          else{
            data.sort(function(a, b){
                  return d3.ascending(a.key, b.key)
            })
          }
          var gridData=[]

          data.forEach(function(d){
            d.values.forEach(function(v){
              gridData.push(
                {
                  "reporting":d.key,
                  "year":+v.year,
                  "values":v
                }
              )
            })
          })

          var reportings=gridData.map(function(d){
            return d.reporting;
          })
          // var years=gridData.map(function(d){
          //   return d.year;
          // })
          var years=d3.range(1786,1938)

          reportings=d3.set(reportings).values();
          // years=d3.set(years).values();

          var emptyMatrix=[]
          reportings.forEach(function(d){
              years.forEach(function(y){
                emptyMatrix.push({
                  reporting:d,
                  year:y
                })
              })
          })

          //map reportings array to object
          var reporting_map={}
          reportings.forEach(function(d,i){ reporting_map[d]=i });

          height=gridHeight*reportings.length;

          var svg = d3.select("#reporting-entities-container").append("svg")
                    .attr("width",width + margin.left + margin.right)
                    .attr("height",height+margin.top+margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          // console.log(maxVal)

          var color = d3.scale.linear()
                        .domain(d3.extent(gridData,function(d){ return  +d.values[yValue];}))
                        .range(["#9e9ac8","#54278f"])
                        // .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

          x.domain([1786,1938]);


          y.domain([0,reportings.length-1])
            .range([0, height]);


          var gridWidth=width/(1938-1786);

          var value_range=(color.domain()[1]-color.domain()[0])/5;
          var legend_sample=d3.range(color.domain()[0],color.domain()[1],value_range)
          console.log(legend_sample)
          var legend=svg.append("g")
                     .attr("class",legend)
                     .attr("transform", "translate(" +(width-margin.right-100) + ","+(0-margin.top)+")");
          var legend_g=legend.selectAll("legend")
                .data(legend_sample)
                .enter().append("g")

          legend_g.append("rect")
                .attr("x", function(d,i) { return i*20;})
                .attr("y", 0)
                .attr("width", 20)
                .attr("height", 10)
                .style("fill", function(d) {return color(d);})

          // legend_g.append("text")
          //         .text(function(d,i){ return i+1})
          //         .attr("text-anchor","start")
          //         .attr("x", function(d,i) { return i*20;})
          //         .attr("y", 6)
          //         .attr("font-size",11)



          svg.append("g")
                .attr("class", "x axis")
                .call(xAxis);

          var matrix=svg.append("g")
                     .attr("class", "matrix")
                     .attr("transform", "translate(0 ,"+ gridGap + ")");


          var emptymap=matrix.append("g")
                        .selectAll(".emptycell")
                        .data(emptyMatrix)
                        .enter().append("rect")
                        .attr("x", function(d) { return x(d.year);})
                        .attr("y", function(d) { return y(reporting_map[d.reporting]);})
                        .attr("class", "emptycell")
                        .attr("width", gridWidth-gridGap)
                        .attr("height", gridHeight-gridGap )
                        .style("fill", "lightgrey")

          var tile=matrix.append("g")
                      .selectAll(".entities")
                      .data(data)
                      .enter().append("g")
                      .attr("class","entities")
                      .attr("transform", function(d){ return "translate(0 ,"+ y(reporting_map[d.key]) + ")"});

          tile.each(function(d){
              var e = d3.select(this);
              e.selectAll("rect")
               .data(d.values)
               .enter().append("rect")
               .attr("x", function(v) { return x(v.year);})
               .attr("width", gridWidth-gridGap)
               .attr("height", gridHeight-gridGap )
               .style("fill", function(v) {return continentColors[v.continent];})
               .on('mouseover', function(v) {
                  d3.select(this).style("stroke","black");
                  d3.select(this.parentNode).select("text").style("stroke","black");
                  return tooltip.html(
                    "<h5>"+ d.key + " in " + v.year + "</h5>" +
                    "<p>"+yName+": " + v[yValue] + "</p>"
                    // "<p>Percent: " + d.y + "</p>"
                    ).transition().style("opacity", .9);
                })
                .on('mouseout', function(v) {
                  d3.select(this).style("stroke","none");
                  d3.select(this.parentNode).select("text").style("stroke","none");
                  return tooltip.transition().style("opacity", 0);
                })
                .on('mousemove', function(v) {
                    d3.select(this.parentNode).select("text").style("stroke","black");
                    tooltip.style("opacity", .9)
                    // var wid = tooltip.style("width").replace("px", "");
                    .style("left", (Math.min(window.innerWidth,
                        Math.max(0, (d3.event.pageX)))-75) + "px")
                    .style("top", (d3.event.pageY + 75) + "px")
                    .style("width", "150px");
                      // .style("width", wid + "px");
                });

               e.append("text")
                .text(function(d){ return d.key})
                .attr("text-anchor","end")
                .attr("x",-2)
                .attr("y",6)
                .attr("font-size",11)

            })

          // var heatmap = svg.selectAll(".cell")
          //               .data(data)
          //               .enter().append("rect")
          //               .attr("x", function(d) { return x(d.year);})
          //               .attr("y", function(d) { return y(reporting_map[d.reporting]);})
          //               .attr("class", "cell")
          //               .attr("width", gridWidth-gridGap)
          //               .attr("height", gridHeight-gridGap )
          //               .style("fill", function(d) { return color(+d.values.total); })
          }
      }
  }
}])