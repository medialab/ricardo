(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.doubleBarChart = function(){

    var height = 600,
        width = 600,
        barColors = ["#7CA49E", "#D35530"],
        duration = 1000,
        order = "total";


    function doubleBarChart(selection){
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

        var xImp = d3.scale.linear()
            .range([chartWidth/2, chartWidth]);

        var xExp = d3.scale.log()
            .range([chartWidth/2, 0]);

        var y = d3.scale.ordinal()
            .rangeBands([0, chartHeight],0.5,0);

        //var colorDomain = data.map(function(d){return d.key});

        //var color = d3.scale.ordinal().range(barColors).domain(colorDomain)

        var xImpMax = d3.max(data, function(d){return d.value.imp});
        var xImpMin = d3.min(data, function(d){return d.value.imp});
        var xExpMax = d3.max(data, function(d){return d.value.exp});

        xImp.domain([xImpMin,xImpMax])
        xExp.domain([0,xExpMax])
        y.domain(data.map(function(d){return d.key}))

        var barsImp = chart.selectAll(".imp")
                      .data(data)

        barsImp
          .enter()
          .append("rect")
          .attr("class", "imp")
          .attr("x", chartWidth/2)
          .attr("y", function(d){return y(d.key)})
          .attr("width", function(d){return xImp.(d.value.imp)})
          .attr("height", y.rangeBand())
          .attr("fill", barColors[0])

        // stacked
        //   .transition()
        //   .duration(500)
        //   .attr("d", function(d) { return area(d.values); })

        // stacked.append("path")
        //   .attr("class", "area")
        //   .attr("d", function(d) { return area(d.values); })
        //   .attr("fill", function(d) { return color(d.key); });
        
        // /* legend */
        
        // var legendScale = d3.scale.ordinal().rangeBands([0, chartWidth/3], 0, 0).domain(colorDomain)

        // var legends = chart.selectAll(".timeline-legend").data(colorDomain)

        // var legend = legends.enter()
        //   .append("g")
        //   .attr("class", "timeline-legend")
        //   .attr("transform", function(d){ return "translate(" + legendScale(d) + "," + (height - 20) + ")"});

        // legend
        //   .append("rect")
        //   .attr("fill", function(d){return color(d)})
        //   .attr("width", 10)
        //   .attr("height", 10)
        //   .attr("x", 0)
        //   .attr("y", -10)

        // legend
        //   .append("text")
        //   .text(function(d){return d.toUpperCase()})
        //   .attr("font-family", "'montserrat', 'Arial', sans-serif")
        //   .attr("font-weight","bold")
        //   .attr("font-size", "0.8em")
        //   .attr("x", 20)

        // /* axis */

        // if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty()){

        //   chart.append("g")
        //     .attr("class", "x axis")
        //     .attr("transform", "translate(0," + chartHeight + ")")
        //     .call(xAxis);

        //   var gy = chart.append("g")
        //       .attr("class", "y axis")
        //       .call(yAxis)
        //       .call(customAxis);
              
        //   gy.selectAll("g").filter(function(d) { return d; })
        //       .classed("minor", true);
        // }

        // function customAxis(g) {
        //   g.selectAll("text")
        //     .attr("x", 4)
        //     .attr("dy", -4)
        //     .attr("font-size", "0.85em");
        //   }

      }); //end selection
    } // end doubleBarChart


  doubleBarChart.height = function(x){
    if (!arguments.length) return height;
    height = x;
    return doubleBarChart;
  }

  doubleBarChart.width = function(x){
    if (!arguments.length) return width;
    width = x;
    return doubleBarChart;
  }

  doubleBarChart.barColors = function(x){
    if (!arguments.length) return barColors;
    barColors = x;
    return doubleBarChart;
  }

  doubleBarChart.order = function(x){
    if (!arguments.length) return order;
    order = x;
    return doubleBarChart;
  }

  doubleBarChart.duration = function(x){
    if (!arguments.length) return duration;
    duration = x;
    return doubleBarChart;
  }


  return doubleBarChart;

  }

})();