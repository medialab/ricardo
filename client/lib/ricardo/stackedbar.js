(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.stackedBar = function(){

    var height = 600,
        width = 600,
        stackColors = ["#0EA789", "#0EA789"],
        brushDate,
        duration = 2000,
        dispatch = d3.dispatch("brushed");


    function stackedBar(selection){
      selection.each(function(data){

        var chart;
        var margin = {top: 10, right: 0, bottom: 40, left: 60},
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

        var colorDomain = data.map(function(d){return d.key});

        var color = d3.scale.ordinal().range(stackColors).domain(colorDomain)

        var area = d3.svg.area()
            .x(function(d) { return x(d.year); })
            .y0(function(d) { return y(d.y0); })
            .y1(function(d) { return y(d.y0 + d.y); });

        var stack = d3.layout.stack()
            .values(function(d) { return d.values; })
            .x(function x(d) {return d.year})
            .y(function y(d) {return d.total})

        var layers = stack(data)

        var yStackMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.y0 + d.y; }); });
        var xMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.year; }); });
        var xMin = d3.min(layers, function(layer) {return d3.min(layer.values, function(d) { return d.year; }); });

        x.domain([xMin,xMax])
        y.domain([0,yStackMax])

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5)
            .tickSize(-width)
            .tickFormat(d3.format("2s"))

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")

        var stacked = chart.selectAll(".stack")
                      .data(layers)
                      .enter().append("g")
                      .attr("class", "stack")

        stacked
          .transition()
          .duration(500)
          .attr("d", function(d) { return area(d.values); })

        stacked.append("path")
          .attr("class", "area")
          .attr("d", function(d) { return area(d.values); })
          .attr("fill", function(d) { return color(d.key); });
        
        // var legendScale = d3.scale.ordinal().rangeBands([0, chartWidth], 0, 0.1).domain(colorDomain)

        // var legends = chart.selectAll(".timeline-legend").data(colorDomain)

        // var legend = legends.enter()
        //   .append("g")
        //   .attr("class", "timeline-legend")
        //   .attr("transform", function(d){ return "translate(" + legendScale(d) + "," + (height - 20) + ")"});

        // legend
        //   .append("rect")
        //   .attr("fill", function(d){return color(d)})
        //   .attr("width", 15)
        //   .attr("height", 15)
        //   .attr("x", 0)
        //   .attr("y", -15)

        // legend
        //   .append("text")
        //   .text(function(d){return d.toUpperCase()})
        //   .attr("x", 20)
        //   .attr("dy", "-0.25em")

        /* axis */

        if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty()){

          chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(xAxis);

          var gy = chart.append("g")
              .attr("class", "y axis")
              .call(yAxis);
              
          gy.selectAll("g").filter(function(d) { return d; })
              .classed("minor", true);
        }

        /* Brush */
      
        var brush = d3.svg.brush()
          .x(x)
          //.extent([startBrush, endBrush])
          .on("brushend", brushended);

        function brushended() {
          if (!d3.event.sourceEvent) return; // only transition after input
          var extent0 = brush.extent(),
              extent1 = extent0.map(d3.time.year);

          d3.select(this).transition()
              .call(brush.extent(extent1))
              .call(brush.event);
          if (brush.empty())  dispatch.brushed(x.domain())
          else dispatch.brushed(brush.extent()); 
        }
        //selection.selectAll("g.brush").remove();
        
        var gBrush = chart.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.event);

        gBrush.selectAll("rect")
            .attr("height", chartHeight);


      }); //end selection
    } // end stackedBar


  stackedBar.height = function(x){
    if (!arguments.length) return height;
    height = x;
    return stackedBar;
  }

  stackedBar.width = function(x){
    if (!arguments.length) return width;
    width = x;
    return stackedBar;
  }

  stackedBar.stackColors = function(x){
    if (!arguments.length) return stackColors;
    stackColors = x;
    return stackedBar;
  }

  stackedBar.brushDate = function(x){
    if (!arguments.length) return brushDate;
    brushDate = x;
    return stackedBar;
  }

  stackedBar.duration = function(x){
    if (!arguments.length) return duration;
    duration = x;
    return stackedBar;
  }


  d3.rebind(stackedBar, dispatch, 'on');

  return stackedBar;

  }

})();