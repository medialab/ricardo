/* Directives */
angular
  .module("ricardo.directives.barChart", [])

  /* directive with watch, update and draw functions */
  .directive("barChart", [
    function () {
      return {
        restrict: "E",
        scope: {
          ngData: "=",
          startDate: "=",
          endDate: "=",
          rawStartDate: "=",
          rawEndDate: "=",
          // {(data):string} function that takes the data and generate the text for the tooltip
          tooltipFunction: "=",
        },
        link: function (scope, element, attrs) {
          const rootElement = element[0];
          const tooltip = d3.select(rootElement).append("div").attr("class", "dataviz-tooltip");

          // Manage the lifecycle of the container
          const container = d3.select(rootElement).append("div").attr("id", "bar-chart-container");
          element.on("$destroy", function () {
            d3.select("#bar-chart-container").remove();
          });

          scope.$watchCollection("[ngData, startDate, endDate, tooltipFunction]", function (newValue, oldValue) {
            if (newValue && scope.ngData) {
              d3.select("#bar-chart-container svg").remove();
              barChart(newValue[0], newValue[1], newValue[2], newValue[3]);
            }
          });

          var margin = { top: 20, right: 0, bottom: 40, left: 0 },
            width = rootElement.offsetWidth,
            height = 60;

          var x = d3.time.scale().range([0, width]);
          var y = d3.scale.linear().range([height, 0]);

          var xAxis = d3.svg.axis().scale(x).orient("bottom");
          var yAxis = d3.svg.axis().scale(y).orient("right").ticks(4).tickSize(0);

          function customAxis(g) {
            g.selectAll("text").attr("x", 4).attr("dy", -4).attr("font-size", "0.85em");
          }

          function barChart(data, start, end, tooltipFunction) {
            var svg = container
              .append("svg")
              .attr("width", width)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([new Date(start, 0, 1), new Date(end, 0, 1)]);
            y.domain([
              0,
              d3.max(
                data.filter((d) => {
                  return start <= d.year && d.year <= end;
                }),
                function (d) {
                  return d.nbEntities || d.nb_reporting;
                },
              ),
            ]);

            var endStart = end - start;
            var barWidth = Math.floor(width / endStart);

            if (svg.select("g").empty()) {
              svg
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

              svg.append("g").attr("class", "y axis").call(yAxis).call(customAxis);

              svg
                .selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                  return x(new Date(d.year, 0, 1));
                })
                .attr("width", barWidth)
                .attr("y", function (d) {
                  return y(d.nbEntities || d.nb_reporting);
                })
                .attr("height", function (d) {
                  return height - y(d.nbEntities || d.nb_reporting);
                })
                .style({ fill: "#cc6666" })
                .on("mouseover", function (e) {
                  tooltip.html(tooltipFunction(e)).transition().duration(200).style("visibility", "visible");
                })
                .on("mouseout", function (e) {
                  tooltip.transition().duration(200).style("visibility", "hidden");
                })
                .on("mousemove", function (e) {
                  tooltip.style("left", d3.event.x + 10 + "px").style("top", d3.event.y + 10 + "px");
                });

              /* 50 line */
              svg
                .append("line")
                .attr("class", "line50")
                .attr("x1", 0)
                .attr("y1", y(50))
                .attr("x2", width)
                .attr("y2", y(50))
                .attr("stroke-width", 1)
                .attr("stroke", "grey");

              /* 100 line */
              svg
                .append("line")
                .attr("class", "line100")
                .attr("x1", 0)
                .attr("y1", y(100))
                .attr("x2", width)
                .attr("y2", y(100))
                .attr("stroke-width", 1)
                .attr("stroke", "grey");
            } else {
              svg
                .selectAll(".bar")
                .data(data)
                .transition()
                .duration(500)
                .attr("x", function (d) {
                  return x(new Date(d.year, 0, 1));
                })
                .attr("width", barWidth)
                .attr("y", function (d) {
                  return y(d.nbEntities || d.nb_reporting);
                })
                .attr("height", function (d) {
                  return height - y(d.nbEntities || d.nb_reporting);
                });

              svg.select(".x.axis").transition().duration(500).call(xAxis);
              svg.select(".y.axis").transition().duration(500).call(yAxis).call(customAxis);
              svg.select(".line50").attr("y1", y(50)).attr("y2", y(50));
              svg.select(".line100").attr("y1", y(100)).attr("y2", y(100));
            }
          }
        },
      };
    },
  ]);
