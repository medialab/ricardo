(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.linechart = function(){

    var height = 400,
        width = 600,
        lineColors = ['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c'],
        sort = [],
        yValue = 'total',
        duration = 500;


    function linechart(selection){
      selection.each(function(data){
        var chart;
        var margin = {top: 20, right: 5, bottom: 30, left: 5},
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

        var colorDomain = sort;

        var color = d3.scale.ordinal().range(lineColors).domain(colorDomain);
        

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
                if(prefix.symbol == "G"){
                  symbol = "billion"
                }else if(prefix.symbol == "M"){
                  symbol = "million"
                }else if(prefix.symbol == "k"){
                  symbol = "thousand"
                }else{
                  symbol = ""
                }
                return prefix.scale(d) + " " + symbol
              }
              
              })


        var gy = chart.select("g.y.axis")
            gx = chart.select("g.x.axis");

        if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty()){

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
        }else{

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
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); });

        var entities = chart.selectAll(".line")
            .data(data, function(d){return d.key})
          
        entities.transition()
          .duration(duration)
                .attr("d", function(d) { return line(d.values); })
                .attr("stroke", function(d,i) { return color(d.key); })
                .attr("fill", "none")

        entities.enter()
              .append("path")
                .attr("class", "line")
                .attr("d", function(d) { return line(d.values); })
                .attr("stroke", function(d,i) { return color(d.key); })
                .attr("fill", "none")
                .attr("stroke-width", "2px")

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
              .data(voronoi(d3.merge(data.map(function(d) { return d.values; }))))

          voronoiGraph.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                .datum(function(d) { return d.point; })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);


          voronoiGraph
                .enter().append("path")
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                .datum(function(d) {return d.point; })
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

          function mouseover(d) {
              focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
              focus.select("text").text(format(Math.round(d[yValue])));
            }

          function mouseout(d) {
              focus.attr("transform", "translate(-100,-100)");
            }

        
      }); //end selection
    } // end linechart


  linechart.height = function(x){
    if (!arguments.length) return height;
    height = x;
    return linechart;
  }

  linechart.width = function(x){
    if (!arguments.length) return width;
    width = x;
    return linechart;
  }

  linechart.lineColors = function(x){
    if (!arguments.length) return lineColors;
    lineColors = x;
    return linechart;
  }

  linechart.duration = function(x){
    if (!arguments.length) return duration;
    duration = x;
    return linechart;
  }

  linechart.sort = function(x){
    if (!arguments.length) return sort;
    sort = x;
    return linechart;
  }

  linechart.yValue = function(x){
    if (!arguments.length) return yValue;
    yValue = x;
    return linechart;
  }

  return linechart;

  }

})();