/*
 * Linechart directive displays line of entities selected
 */
angular
  .module("ricardo.directives.linechartWorld", [])

  .directive("linechartWorld", [
    function () {
      return {
        restrict: "E",
        scope: {
          ngData: "=",
          currency: "=",
          startDate: "=",
          endDate: "=",
          flowType: "=",
          view: "=",
        },
        link: function (scope, element, attrs) {
          // Manage the lifecycle of the container
          const rootElement = element[0];
          const container = d3.select(rootElement).append("div").attr("id", "linechart-world-container");
          element.on("$destroy", function () {
            d3.select("#linechart-world-container").remove();
          });

          function noData(entity, minDate, maxDate) {
            d3.select("#linechart-world-container")
              .append("div")
              .attr("class", "alert")
              .attr("id", "missingDataLineChart")
              .html(function () {
                return (
                  '<div class="modal-body" ><p> There is <strong>no data available</strong> in the database for ' +
                  entity +
                  "<br> between <strong>" +
                  minDate +
                  "</strong> and <strong>" +
                  maxDate +
                  "</strong></p>" +
                  '<p>Change date selection, thank you !</p> </div> <div class="modal-footer"><button class="btn btn-default" ng-click="okPartner()">OK</button></div>'
                );
              })
              .on("click", function () {
                d3.selectAll("div#missingDataLineChart").remove();
              });
          }
          scope.$watch(
            "ngData",
            function (newValue, oldValue) {
              if (newValue && newValue.length > 0)
                linechart(newValue, newValue[0].flowType, scope.startDate, scope.endDate);
            },
            true,
          );
          scope.$watchCollection("[ngData,startDate,endDate]", function (newValue, oldValue) {
            if (newValue[0] && newValue[0].length > 0) {
              yValue = newValue[0][0].flowType;
              var minDate = newValue[1];
              var maxDate = newValue[2];
              currency = scope.currency.name.value;

              linechart(newValue[0], yValue, minDate, maxDate);

              //check/alert the new added reporting has all null value
              var newData = newValue[0][newValue[0].length - 1];
              var missingData = newData.values
                .filter(function (d) {
                  return d !== undefined && d !== null && d.year >= minDate && d.year <= maxDate;
                })
                .every(function (d) {
                  return d[yValue] === null;
                });
              if (missingData) noData(newData.key, minDate, maxDate);
              else d3.selectAll("div#missingDataLineChart").remove();
            } else {
              d3.select("#linechart-world-container").select("svg").remove();
            }
          });

          var height = 400,
            width = rootElement.offsetWidth,
            sort = [],
            yValue = "total",
            duration = 500;

          var margin = { top: 20, right: 0, bottom: 30, left: 0 },
            chartWidth = width - margin.left - margin.right,
            chartHeight = height - margin.top - margin.bottom;

          var currency = scope.currency.name.value;
          var x = d3.time.scale().range([0, chartWidth]);

          var y = d3.scale.linear().range([chartHeight, 0]);

          /*
           * Lines
           */
          const line = d3.svg
            .line()
            .defined(function (d) {
              return d !== undefined && d !== null && d[yValue] !== null;
            })
            .x(function (d) {
              return x(new Date(d.year, 0, 1));
            })
            .y(function (d) {
              return y(d[yValue]);
            });

          /*
           * Axis config
           */
          var xAxis = d3.svg.axis().scale(x).orient("bottom");

          var yAxis = d3.svg
            .axis()
            .scale(y)
            .orient("right")
            .ticks(5)
            .tickSize(width)
            .tickFormat(function (d, i) {
              var prefix = d3.formatPrefix(d);
              if (i == 0) {
                return;
              } else {
                var symbol;
                if (currency === "Sterling") {
                  if (prefix.symbol === "G") {
                    symbol = "billion";
                  } else if (prefix.symbol === "M") {
                    symbol = "million";
                  } else if (prefix.symbol === "k") {
                    symbol = "thousand";
                  } else {
                    symbol = "";
                  }
                  return prefix.scale(d) + " " + symbol;
                } else if (currency === "Percent") {
                  symbol = "%";
                  return d + " " + symbol;
                }
              }
            });

          function customAxis(g) {
            g.selectAll("text").attr("x", 4).attr("dy", -4).attr("font-size", "0.85em");
          }

          function linechart(data, yValue, minDate, maxDate) {
            var dataFlatten = [];
            data.forEach(function (d) {
              d.values.forEach(function (v) {
                dataFlatten.push(v);
              });
            });
            var dataFiltered = dataFlatten.filter(function (d) {
              return d !== undefined && d !== null && d.year >= minDate && d.year <= maxDate;
            });
            var yMax = d3.max(dataFiltered, function (d) {
              return d[yValue];
            });

            x.domain([new Date(minDate, 0, 1), new Date(maxDate, 0, 1)]);
            y.domain([0, yMax]);

            if (container.select("svg").empty()) {
              var chart = container
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("class", "chart")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
              chart
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + chartHeight + ")")
                .call(xAxis);

              chart.append("g").attr("class", "y axis").call(yAxis).call(customAxis);
            } else {
              var chart = container.select(".chart");
              chart.select("g.x.axis").transition().duration(duration).call(xAxis);

              chart.select("g.y.axis").transition().duration(duration).call(yAxis).call(customAxis);
            }

            chart.selectAll(".country").remove();
            var entities = chart
              .selectAll(".country")
              .data(transformationWithOneValuePerYear(data, minDate, maxDate))
              .enter()
              .append("g")
              .attr("class", "country");

            entities
              .append("path")
              .attr("class", "line")
              .attr("d", function (d) {
                return line(d.values);
              })
              .attr("stroke", function (d, i) {
                return d["color"];
              })
              .attr("fill", "none")
              .attr("stroke-width", "2px");

            var point = entities
              .selectAll(".point")
              .data(function (d) {
                return d.values.filter(function (e, i) {
                  if (e !== undefined && e !== null && e[yValue] !== null) {
                    if (i === 0) {
                      if (d.values[i + 1][yValue] === null) return e;
                    } else if (i === d.values.length - 1) {
                      if (d.values[i - 1][yValue] === null) return e;
                    } else {
                      if (d.values[i - 1][yValue] === null && d.values[i + 1][yValue] === null) return e;
                    }
                  }
                }); //filter out null data
              })
              .enter()
              .append("circle")
              .attr("class", "point")
              .attr("cx", line.x())
              .attr("cy", line.y())
              .attr("r", 1)
              .attr("fill", function () {
                return d3.select(this.parentNode).datum().color;
              })
              .attr("stroke", function () {
                return d3.select(this.parentNode).datum().color;
              });

            /*
             * Mouse interactions
             */
            var focus = chart.select(".focus");

            if (focus.empty()) {
              focus = chart.append("g").attr("transform", "translate(-100,-100)").attr("class", "focus");
            }

            focus.append("circle").attr("r", 3).attr("pointer-events", "none");

            focus.append("text").attr("y", -10).attr("pointer-events", "none");

            /*
             * Voronoi
             */
            var voronoi = d3.geom
              .voronoi()
              .x(function (d) {
                return x(new Date(d.year, 0, 1));
              })
              .y(function (d) {
                return y(d[yValue]);
              })
              .clipExtent([
                [-margin.left, -margin.top],
                [width + margin.right, height + margin.bottom],
              ]);

            var voronoiGroup = chart.select(".voronoi");

            if (voronoiGroup.empty()) {
              voronoiGroup = chart
                .append("g")
                .attr("class", "voronoi")
                .attr("fill", "none")
                .attr("pointer-events", "all");
            }

            var voronoiGraph = voronoiGroup.selectAll("path").data(
              voronoi(
                dataFiltered.filter(function (d) {
                  return d[yValue];
                }),
              ),
            );

            voronoiGraph
              .attr("d", function (d) {
                if (d !== undefined) return "M" + d.join("L") + "Z";
              })
              .datum(function (d) {
                if (d !== undefined) return d.point;
              })
              .on("mouseover", mouseover)
              .on("mouseout", mouseout);

            voronoiGraph
              .enter()
              .append("path")
              .attr("d", function (d) {
                if (d !== undefined) return "M" + d.join("L") + "Z";
              })
              .datum(function (d) {
                if (d !== undefined) return d.point;
              })
              .on("mouseover", mouseover)
              .on("mouseout", mouseout);

            voronoiGraph.exit().remove();

            var format = d3.format("0,000");

            function colorLine(country) {
              var color;
              data.forEach(function (d) {
                if (d.key === country) color = d.color;
              });
              return color;
            }

            function mouseover(d) {
              if (d !== undefined) {
                if (d[yValue] !== null && d[yValue] !== undefined) {
                  var colorPoint = scope.view === "world" ? colorLine(d.reporting_id) : colorLine(d.partner_id);
                  focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                  if (currency === "Percent")
                    focus
                      .select("text")
                      .attr("fill", colorPoint)
                      .text(d3.round(d[yValue], 2) + " %");
                  else
                    focus
                      .select("text")
                      .attr("fill", colorPoint)
                      .text(format(Math.round(d[yValue])) + " £");

                  focus.select("text").attr("text-anchor", function (d) {
                    var xPos = d3.transform(d3.select(this.parentNode).attr("transform")).translate[0];
                    var tWidth = d3.select(this).node().getBBox().width;
                    if (xPos - tWidth / 2 < 0) return "start";
                    else if (xPos + tWidth / 2 > width) return "end";
                    else return "middle";
                  });
                  chart
                    .append("line")
                    .attr("class", "lineDate")
                    .attr("x1", x(new Date(d.year, 0, 1)))
                    .attr("y1", y(d[yValue]))
                    .attr("x2", x(new Date(d.year, 0, 1)))
                    .attr("y2", 350)
                    .attr("stroke-width", 1)
                    .attr("stroke", "grey");

                  var text = chart
                    .append("text")
                    .attr("class", "lineDate")
                    .attr("x", x(new Date(d.year, 0, 1)) - 15)
                    .attr("y", 368)
                    .attr("font-size", "0.85em")
                    .text(d.year)
                    .attr("pointer-events", "none");

                  // Define the gradient
                  var gradient = chart
                    .append("chart:defs")
                    .append("chart:linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                  // Define the gradient colors
                  gradient
                    .append("chart:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "white")
                    .attr("stop-opacity", 0.1);

                  gradient
                    .append("chart:stop")
                    .attr("offset", "50%")
                    .attr("stop-color", "white")
                    .attr("stop-opacity", 1);

                  gradient
                    .append("chart:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "white")
                    .attr("stop-opacity", 0.1);

                  // add rect as background to hide date display in
                  var bbox = text.node().getBBox();
                  var rect = chart
                    .append("chart:rect")
                    .attr("class", "lineDateText")
                    .attr("x", bbox.x - 50)
                    .attr("y", bbox.y)
                    .attr("width", bbox.width + 100)
                    .attr("height", bbox.height)
                    .style("fill", "url(#gradient)")
                    .attr("pointer-events", "none");

                  // add date
                  var textDate = chart
                    .append("text")
                    .attr("class", "lineDateText")
                    .attr("x", x(new Date(d.year, 0, 1)) - 15)
                    .attr("y", 368)
                    .attr("font-size", "0.85em")
                    .text(d.year)
                    .attr("pointer-events", "none");
                }
              }
            }

            function mouseout(d) {
              chart.selectAll("line.lineDate").remove();
              chart.selectAll("text.lineDate").remove();
              chart.selectAll("text.lineDateText").remove();
              chart.selectAll("rect.lineDateText").remove();
              focus.attr("transform", "translate(-100,-100)");
            }

            function transformationWithOneValuePerYear(data, startYear, endYear) {
              const copy = angular.copy(data);
              return copy.map((dataPerCountry) => {
                dataPerCountry.values = d3.range(startYear, endYear, 1).map((year) => {
                  return (
                    dataPerCountry.values.find((e) => {
                      return e !== undefined && e.year === year;
                    }) || {
                      year: year,
                      imp: null,
                      exp: null,
                      total: null,
                    }
                  );
                });
                return dataPerCountry;
              });
            }
          } // end linechart
        },
      };
    },
  ]);
