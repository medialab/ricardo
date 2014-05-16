(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.stackedBar = function(){

    var height = 600,
        width = 600,
        stackColors = ["#0EA789", "#0EA789"],
        brushDate,
        duration = 1000,
        dispatch = d3.dispatch("brushed", "brushing");


    function stackedBar(selection){
      selection.each(function(data){

        var chart;
        var margin = {top: 10, right: 0, bottom: 50, left: 0},
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
            .orient("right")
            .ticks(6)
            .tickSize(width)
            .tickFormat(function(d,i){
              var prefix = d3.formatPrefix(d)
              if(i == 0){
                return
              }
              else if(i == 5){
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
                return "£" + prefix.scale(d) + " " + symbol
              }
              else{
                return prefix.scale(d)
              }
              
              })

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
        
        /* legend */
        
        var legendScale = d3.scale.ordinal().rangeBands([0, chartWidth/3], 0, 0).domain(colorDomain)

        var legends = chart.selectAll(".timeline-legend").data(colorDomain)

        var legend = legends.enter()
          .append("g")
          .attr("class", "timeline-legend")
          .attr("transform", function(d){ return "translate(" + legendScale(d) + "," + (height - 20) + ")"});

        legend
          .append("rect")
          .attr("fill", function(d){return color(d)})
          .attr("width", 10)
          .attr("height", 10)
          .attr("x", 0)
          .attr("y", -10)

        legend
          .append("text")
          .text(function(d){return d.toUpperCase()})
          .attr("font-family", "'montserrat', 'Arial', sans-serif")
          .attr("font-weight","bold")
          .attr("font-size", "0.8em")
          .attr("x", 20)

        /* axis */

        if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty()){

          chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(xAxis);

          var gy = chart.append("g")
              .attr("class", "y axis")
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

        /* Brush */
      
        var brush = d3.svg.brush()
          .x(x)
          //.extent([startBrush, endBrush])
          .on("brush", function(){
            if(brush.empty()){
            brush.clear()
            dispatch.brushing(x.domain())

            }
            else{
              dispatch.brushing(brush.extent())
            }
          })
          .on("brushend", brushended);

        function brushended() {
          if (!d3.event.sourceEvent) return; // only transition after input
          var extent0 = brush.extent(),
              extent1 = extent0.map(d3.time.year);

          d3.select(this).transition()
              .call(brush.extent(extent1))
              .call(brush.event);
          
          if(brush.empty()){
            brush.extent(x.domain())
            dispatch.brushed(x.domain())
            dispatch.brushing(x.domain())
          }
          else{
            dispatch.brushed(brush.extent())
            dispatch.brushing(brush.extent())
          }
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