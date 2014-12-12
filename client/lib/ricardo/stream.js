(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.stream = function(){

    var height = 600,
        width = 600,
        stackColors = ["#0EA789", "#0EA789"],
        duration = 1000;


    function stream(selection){
      selection.each(function(data){

        var chart;
        var margin = {top: 15, right: 0, bottom: 0, left: 0},
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

        var x = d3.scale.ordinal()
            .rangeBands([0, chartWidth], 0.98, 0);

        var y = d3.scale.linear()
            .range([0, chartHeight]);

        var colorDomain = data.map(function(d){return d.key});

        var color = d3.scale.ordinal().range(stackColors).domain(colorDomain)

        var stack = d3.layout.stack()
            .values(function(d) { return d.values; })
            //.offset("zero")

        var layers = stack(data)

        var yStackMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.y0 + d.y; }); });
        var xMax = d3.max(layers, function(layer) {return d3.max(layer.values, function(d) { return d.x; }); });
        var xMin = d3.min(layers, function(layer) {return d3.min(layer.values, function(d) { return d.x; }); });

        x.domain([xMin,xMax])
        y.domain([0,yStackMax])


        var stacked = chart.selectAll(".stack").data(layers)
                      
        //stacked.transition().duration()
        //  .attr("class", "stack")

        stacked.enter().append("g")
          .attr("class", "stack")

        // stacked
        //   .transition()
        //   .duration(500)
        //   .attr("d", function(d) { return area(d.values); })

        function drawLink(p1, p2, p3, p4){
          // clockwise
          // left upper corner
          var p1x = p1[0]
          var p1y = p1[1]
          // right upper corner
          var p2x = p2[0]
          var p2y = p2[1]
          // right lower corner
          var p3x = p3[0]
          var p3y = p3[1]
          // left lower corner
          var p4x = p4[0]
          var p4y = p4[1]
          // medium point
          var m = (p1x + p2x) / 2
          // control points
          var c1 = p1y
          var c2 = p2y
          var c3 = p3y
          var c4 = p4y

          var outputString = "M" + p1x + "," + p1y  // starting point, i.e. upper left point

                 + "C" + m + "," + c1   // control point
                 + " " + m + "," + c2   // control point
                 + " " + p2x + "," + p2y  // reach the end of the step, i.e. upper right point

                 + "L" + p3x + "," + p3y  // reach the lower right point

                 + "C" + m + "," + c3
                 + " " + m + "," + c4
                 + " " + p4x + "," + p4y

                 + "Z";   // close area
          
          return outputString
        };

        var bars = stacked.selectAll("rect").data(function(d){return d.values})

        bars.transition().duration(duration)
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y0); })
          .attr("height", function(d) { return y(d.y)})

        bars.enter().append("rect")
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y0); })
          .attr("width", function(d) { return x.rangeBand() })
          .attr("height", function(d) {return y(d.y)})
          .attr("fill", function(d) { return color(d.key) })
          .attr("stroke", "white")
          .attr("stroke-width", "2px")


        var flows = stacked.selectAll("path").data(function(d){return [d]})

        flows.transition().duration(duration)
          .attr("d", function(d){
            var p1 = [x(d.values[0].x)+ x.rangeBand(), y(d.values[0].y0)],
                p2 = [x(d.values[1].x), y(d.values[1].y0)],
                p3 = [x(d.values[1].x), y(d.values[1].y0+d.values[1].y)],
                p4 = [x(d.values[0].x) + x.rangeBand(), y(d.values[0].y0+d.values[0].y)];

            return drawLink(p1,p2,p3,p4)
          })
        
        flows.enter()
          .append("path")
          .attr("d", function(d){
            var p1 = [x(d.values[0].x)+ x.rangeBand(), y(d.values[0].y0)],
                p2 = [x(d.values[1].x), y(d.values[1].y0)],
                p3 = [x(d.values[1].x), y(d.values[1].y0+d.values[1].y)],
                p4 = [x(d.values[0].x) + x.rangeBand(), y(d.values[0].y0+d.values[0].y)];

            return drawLink(p1,p2,p3,p4)
          })
          .attr("fill", "#eaeaea")
          .attr("stroke", "white")
          .attr("stroke-width", "2px")
        
      }); //end selection
    } // end stream


  stream.height = function(x){
    if (!arguments.length) return height;
    height = x;
    return stream;
  }

  stream.width = function(x){
    if (!arguments.length) return width;
    width = x;
    return stream;
  }

  stream.stackColors = function(x){
    if (!arguments.length) return stackColors;
    stackColors = x;
    return stream;
  }

  stream.duration = function(x){
    if (!arguments.length) return duration;
    duration = x;
    return stream;
  }

  return stream;

  }

})();