(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.missing = function(){

    var height = 600,
        width = 600,
        stackColors = ["#0EA789", "#0EA789"],
        duration = 1000;


    function missing(selection){
      selection.each(function(data){

        var chart;
        var margin = {top: 0, right: 0, bottom: 50, left: 0},
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
  
        var x = d3.scale.ordinal().rangeBands([0, chartWidth],0,0);

        var y = d3.scale.linear()
            .range([chartHeight, 0]);

        var colorDomain = data.map(function(d){return d.key});

        var color = d3.scale.ordinal().range(stackColors).domain(colorDomain)

        var stack = d3.layout.stack()
            .values(function(d) { return d.values; })
            .x(function x(d) {return d.year})
            .y(function y(d) {return 1})

        var layers = stack(data)

        var yStackMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.y0 + d.y; }); });
        var xMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.year; }); });
        var xMin = d3.min(layers, function(layer) {return d3.min(layer.values, function(d) { return d.year; }); });

        x.domain(data[0].values.map(function(d) { return d.year; }));
        y.domain([0,yStackMax])

        var stacked = chart.selectAll(".stack")
                      .data(layers, function(d){return d.key})
                      
        stacked.enter().append("g")
                      .attr("class", "stack")
                      .attr("fill", function(d){return color(d.key)})
                      .attr("stroke", function(d){return color(d.key)})

      var circle = stacked.selectAll("circle")
          .data(function(d) { return d.values; })

      circle
        .attr("fill", function(d) { if(!d.total){return "none"} })
        .transition()
        .duration(duration)
        .attr("cx", function(d) { return x(d.year) + (x.rangeBand()/2); })


      circle.enter().append("circle")
          .attr("cx", function(d) { return x(d.year) + (x.rangeBand()/2); })
          .attr("cy", function(d) { return y(d.y0 + d.y) + 3; })
          .attr("r", 3)
          .attr("fill", function(d) { if(!d.total){return "none"} })

      circle.exit().remove()
        
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
          .text(function(d){return d == "imp" ? "IMPORTS" : "EXPORTS"})
          .attr("font-family", "'montserrat', 'Arial', sans-serif")
          .attr("font-weight","bold")
          .attr("font-size", "0.8em")
          .attr("x", 20)

      }); //end selection
    } // end missing


  missing.height = function(x){
    if (!arguments.length) return height;
    height = x;
    return missing;
  }

  missing.width = function(x){
    if (!arguments.length) return width;
    width = x;
    return missing;
  }

  missing.stackColors = function(x){
    if (!arguments.length) return stackColors;
    stackColors = x;
    return missing;
  }

  missing.duration = function(x){
    if (!arguments.length) return duration;
    duration = x;
    return missing;
  }


  return missing;

  }

})();