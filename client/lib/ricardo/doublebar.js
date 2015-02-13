(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.doubleBarChart = function(){

    var height = 600,
        width = 600,
        barColors = ["#7CA49E", "#D35530"],
        duration = 1000,
        barHeigth = 5,
        barGap = 20,
        RICentities,
        order = "tot";


    function doubleBarChart(selection){
      selection.each(function(data){

        data.sort(function(a,b){return d3.descending(a.value[order],b.value[order])})


        
        data = data.filter(function(d){return d.value.tot > 0})


        height = data.length*(barHeigth+barGap)
        
        var chart;
        var margin = {top: barGap, right: 20, bottom: 0, left: 10},
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
          //.transition().duration(duration)
          .attr('width', width)
          .attr('height', height)
            .select("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }

        // var x = d3.scale.log()
        //     .range([2, chartWidth/2]);

        var format = d3.format("0,000");

        var x = d3.scale.linear()
            .range([2, chartWidth/2]);

        var xImpMax = d3.max(data, function(d){return d.value.imp});
        var xImpMin = d3.min(data, function(d){if(d.value.imp) return d.value.imp});
        var xExpMax = d3.max(data, function(d){return d.value.exp});
        var xExpMin = d3.min(data, function(d){if(d.value.exp) return d.value.exp});

        var xMax = xImpMax > xExpMax ? xImpMax : xExpMax;
        var xMin = xImpMin < xExpMin ? xImpMin : xExpMin;


        //x.domain([xMin, xMax])
        x.domain([0, xMax])

      var div = d3.select("body").append("div")   
          .attr("class", "tooltip-elm")               

        var barsImpGroup = chart.select(".barImpGroup")

        if (barsImpGroup.empty()){
          chart.append("g").attr("class", "barImpGroup").attr("transform", "translate(" + chartWidth/2 + ",0)")
          barsImpGroup = chart.select(".barImpGroup")
        }
        
        
        var barsImp = barsImpGroup
                      .selectAll(".imp")
                      .data(data, function(d){return d.key})

        barsImp.transition().duration(duration)
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("width", function(d){
            if(d.value.imp > 0){
              return x(d.value.imp)
            }else{
              return 0
            }
          })
          .each(function(d){
             $(this).tooltip('destroy')
             $(this).tooltip({title:format(d.value.imp), placement:"right", container: 'body'})
          })

        barsImp
          .enter()
          .append("rect")
          .attr("class", "imp")
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("width", function(d){
            if(d.value.imp > 0){
              return x(d.value.imp)
            }else{
              return 0
            }
          })
          .attr("height", barHeigth)
          .attr("fill", barColors[0])
          .each(function(d){
             $(this).tooltip({title: format(d.value.imp), placement:"right", container: 'body'})
          })

        barsImp.exit().remove()

        var barsExpGroup = chart.select(".barExpGroup")

        if (barsExpGroup.empty()){
          chart.append("g").attr("class", "barExpGroup")
          barsExpGroup = chart.select(".barExpGroup")
        }

        var barsExp = barsExpGroup
                      .selectAll(".exp")
                      .data(data, function(d){return d.key})

        barsExp.transition().duration(duration)
          .attr("x", function(d){
            if(d.value.exp > 0){
              return chartWidth/2 - x(d.value.exp)
            }else{
              return chartWidth/2
            }
          })
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("width", function(d){
            if(d.value.exp > 0){
              return x(d.value.exp)
            }else{
              return 0
            }
          })
          .each(function(d){
             $(this).tooltip('destroy')
             $(this).tooltip({title: format(d.value.exp), placement:"left", container: 'body'})
          })

        barsExp
          .enter()
          .append("rect")
          .attr("x", function(d){
            if(d.value.exp > 0){
              return chartWidth/2 - x(d.value.exp)
            }else{
              return chartWidth/2
            }
          })
          .attr("class", "exp")
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("width", function(d){
            if(d.value.exp > 0){
              return x(d.value.exp)
            }else{
              return 0
            }
          })
          .attr("height", barHeigth)
          .attr("fill", barColors[1])
          .each(function(d){
             $(this).tooltip({title: format(d.value.exp), placement:"left", container: 'body'})
          })

        barsExp.exit().remove()

        
        var barsLegendGroup = chart.select(".barLegendGroup")

        if (barsLegendGroup.empty()){
          chart.append("g").attr("class", "barLegendGroup")
          barsLegendGroup = chart.select(".barLegendGroup")
        }


        var barsLegend = barsLegendGroup
                          .selectAll(".legend")
                          .data(data, function(d){return d.key})

        barsLegend.transition().duration(duration)
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("fill", function(d){ if(d.value.tot == 0){return "#999"}else{return "#333"}})

        barsLegend
          .enter()
          .append("text")
          .attr("x", chartWidth/2)
          .attr("class", "legend")
          .attr("y", function(d,i){return i*(barHeigth+barGap)})
          .attr("text-anchor", "middle")
          .attr("font-size", "0.9em")
          .attr("dy", "-0.2em")
          .attr("fill", function(d){ if(d.value.tot == 0){return "#999"}else{return "#333"}})
          .text(function(d){
            var entity = RICentities[""+d.key];
            if (entity){
              return RICentities[""+d.key].RICname;
            }else{
              return d.key;
            }
          })

        barsLegend.exit().remove()

        var barsLegendValue = barsLegendGroup
                          .selectAll(".legendValue")
                          //.data([data[0],data[0]])
                          .data([xMax,xMax])

        barsLegendValue.transition().duration(duration)
          //.attr("y", function(d,i){return 0*(barHeigth+barGap)})
          .attr("fill", function(d){ if(d == 0){return "#999"}else{return "#777"}})
          .text(function(d,i){if(i > 0){return format(d)}else{return format(d)}})
          //.attr("x", function(d,i){if(i > 0){return x(d.value.imp)+chartWidth/2}else{return chartWidth/2 - x(d.value.exp)}})

        barsLegendValue
          .enter()
          .append("text")
          //.attr("x", function(d,i){if(i > 0){return x(d.value.imp)+chartWidth/2}else{return chartWidth/2 - x(d.value.exp)}})
          .attr("x", function(d,i){if(i > 0){return chartWidth}else{return 0}})
          .attr("class", "legendValue")
          .attr("y", function(d,i){return 0*(barHeigth+barGap)})
          .attr("text-anchor", function(d,i){if(i > 0){return "end"}else{return "start"}})
          .attr("font-size", "0.9em")
          .attr("dy", "-0.4em")
          .attr("fill", function(d){ if(d == 0){return "#999"}else{return "#777"}})
          .text(function(d,i){if(i > 0){return format(d)}else{return format(d)}})

        barsLegendValue.exit().remove()
        

        /* custom axis */
        
        var lineFunction = d3.svg.line()
                          .x(function(d) {return d.x; })
                          .y(function(d) {return d.y; })

        var axisImpGroup = chart.select(".axisImpGroup")

        if (axisImpGroup.empty()){
          chart.append("g").attr("class", "axisImpGroup").attr("transform", "translate(" + chartWidth/2 + ",0)")
          axisImpGroup = chart.select(".axisImpGroup")
        }

        var axisExpGroup = chart.select(".axisExpGroup")

        if (axisExpGroup.empty()){
          chart.append("g").attr("class", "axisExpGroup")
          axisExpGroup = chart.select(".axisExpGroup")
        }


        var axisImpData = [
            [{x: x(xMax/2), y: 0},
            {x: x(xMax/2), y: chartHeight}],
            [{x: x(xMax), y: 0},
            {x: x(xMax), y:chartHeight}]
          ]

        var axisExpData = [
            [{x: x(xMax/2), y: 0},
            {x: x(xMax/2), y:chartHeight}],
            [{x: chartWidth/2 - x(xMax), y:0},
            {x: chartWidth/2 - x(xMax), y:chartHeight}]
          ]

        var axisImp = axisImpGroup
                      .selectAll(".axis")
                      .data(axisImpData)
        
        axisImp
           .attr("d", function(d){return lineFunction(d)})

        axisImp
          .enter()
          .append("path")
          .attr("class", "axis")
          .attr("d", function(d){return lineFunction(d)})
          .attr("fill", "none")
          .attr("stroke", "#777")
          .attr("stroke-dasharray", "2,2")

        var axisExp = axisExpGroup
                      .selectAll(".axis")
                      .data(axisExpData)
        
        axisExp
          .attr("d", function(d){return lineFunction(d)})

        axisExp
          .enter()
          .append("path")
          .attr("class", "axis")
          .attr("d", function(d){return lineFunction(d)})
          .attr("fill", "none")
          .attr("stroke", "#777")
          .attr("stroke-dasharray", "2,2")

        

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

  doubleBarChart.RICentities = function(x){
    if (!arguments.length) return RICentities;
    RICentities = x;
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