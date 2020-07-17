/*
 * Directive : comparison timeline between country source & country target
 * with watch, update and draw functions
 */
angular
  .module("ricardo.directives.comparisonTimeline", [])

  .directive("comparisonTimeline", [
    function () {
      return {
        restrict: "E",
        template: '<div id="comparison-timeline-container"></div>',
        scope: {
          ngData: "=",
          startDate: "=",
          endDate: "=",
        },
        link: function (scope, element, attrs) {
          scope.$watchCollection("[ngData, startDate,endDate]", function (newValue, oldValue) {
            if (scope.ngData) {
              draw(scope.ngData);
            }
          });

          var x,
            y,
            xAxis,
            yAxis,
            diffSourceLine,
            diffTargetLine,
            diffSource,
            diffSourceDefined,
            diffTarget,
            diffTargetDefined;

          function draw(data) {
            diffSource = function (d) {
              if (!isNaN(d.exp_mirror) && !isNaN(d.imp) && d.imp !== null && d.exp_mirror !== null) {
                // return ( d.imp_mirror - d.exp ) / d.exp ;
                return (d.imp - d.exp_mirror) / d.imp;
              }
            };

            diffSourceDefined = function (d) {
              return d.exp_mirror !== null && d.imp !== null && d.imp !== 0;
            };

            diffTarget = function (d) {
              if (!isNaN(d.exp) && !isNaN(d.imp_mirror) && d.exp !== null && d.imp_mirror !== null) {
                // return ( d.imp - d.exp_mirror ) / d.exp_mirror ;
                return (d.exp - d.imp_mirror) / d.exp;
              }
            };

            diffTargetDefined = function (d) {
              return d.imp_mirror !== null && d.exp !== null && d.exp !== 0;
            };

            document.querySelector("#comparison-timeline-container").innerHTML = null;

            var margin = { top: 10, right: 0, bottom: 30, left: 0 },
              width = document.querySelector("#comparison-timeline-container").offsetWidth - margin.left - margin.right,
              height = 180 - margin.top - margin.bottom;

            x = d3.time.scale().range([0, width]);

            y = d3.scale.linear().range([height, 0]);

            xAxis = d3.svg.axis().scale(x).orient("bottom");

            yAxis = d3.svg.axis().scale(y).orient("right").ticks(4).tickSize(width);

            x.domain([new Date(scope.startDate - 1, 0, 1), new Date(scope.endDate + 1, 0, 1)]);
            y.domain([
              d3.min(
                data.filter(function (d) {
                  return d.year >= scope.startDate && d.year <= scope.endDate;
                }),
                function (d) {
                  if (diffSourceDefined(d) && diffTargetDefined(d)) {
                    return Math.min(diffSource(d), diffTarget(d));
                  } else if (diffSourceDefined(d)) {
                    return diffSource(d);
                  } else if (diffTargetDefined(d)) {
                    return diffTarget(d);
                  } else {
                    return false;
                  }
                },
              ),
              d3.max(
                data.filter(function (d) {
                  return d.year >= scope.startDate && d.year <= scope.endDate;
                }),
                function (d) {
                  if (diffSourceDefined(d) && diffTargetDefined(d)) {
                    return Math.max(diffSource(d), diffTarget(d));
                  } else if (diffSourceDefined(d)) {
                    return diffSource(d);
                  } else if (diffTargetDefined(d)) {
                  } else {
                    return false;
                  }
                },
              ),
            ]);

            diffSourceLine = d3.svg
              .line()
              .defined(diffSourceDefined)
              .x(function (d) {
                return x(d.date);
              })
              .y(function (d) {
                return y(diffSource(d));
              });

            diffTargetLine = d3.svg
              .line()
              .defined(diffTargetDefined)
              .x(function (d) {
                return x(d.date);
              })
              .y(function (d) {
                return y(diffTarget(d));
              });

            var svg = d3
              .select("#comparison-timeline-container")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            // svg.append("clipPath")
            //   .attr("id", "clip")
            //   .append("rect")
            //   .attr("width", width)
            //   .attr("height", height);

            data.forEach(function (d) {
              d.date = new Date(d.year, 0, 1);
            });

            svg
              .select(".x.axis")
              //.duration(750)
              .call(xAxis);

            svg
              .select(".y.axis")
              //.duration(750)
              .call(yAxis);

            svg.append("path").datum(data).attr("class", "line-compare").attr("d", diffSourceLine);

            svg.append("path").datum(data).attr("class", "line-compare-alt").attr("d", diffTargetLine);

            // add discrete points
            var spoint_g = svg
              .selectAll(".spoint")
              .data(
                data.filter(function (d, i) {
                  if (d.exp_mirror !== null && d.imp !== null && d.imp !== 0) {
                    if (i === 0) {
                      if (data[i + 1].exp_mirror === null || data[i + 1].imp == null || data[i + 1].imp == 0) return d;
                    } else if (i === data.length - 1) {
                      if (data[i - 1].exp_mirror === null || data[i - 1].imp === null || data[i - 1].imp === 0)
                        return d;
                    } else {
                      if (
                        (data[i + 1].exp_mirror === null || data[i + 1].imp === null || data[i + 1].imp === 0) &&
                        (data[i - 1].exp_mirror === null || data[i - 1].imp === null || data[i - 1].imp === 0)
                      )
                        return d;
                    }
                  }
                }),
              )
              .enter()
              .append("g")
              .attr("class", "spoint");
            spoint_g
              .append("circle")
              .attr("cx", diffSourceLine.x())
              .attr("cy", diffSourceLine.y())
              .attr("r", 1.5)
              .attr("fill", "#cc6666");

            var tpoint_g = svg
              .selectAll(".tpoint")
              .data(
                data.filter(function (d, i) {
                  if (d.imp_mirror !== null && d.exp !== null && d.exp !== 0) {
                    if (i === 0) {
                      if (data[i + 1].imp_mirror === null || data[i + 1].exp == null || data[i + 1].exp == 0) return d;
                    } else if (i === data.length - 1) {
                      if (data[i - 1].imp_mirror === null || data[i - 1].exp === null || data[i - 1].exp === 0)
                        return d;
                    } else {
                      if (
                        (data[i + 1].imp_mirror === null || data[i + 1].exp === null || data[i + 1].exp === 0) &&
                        (data[i - 1].imp_mirror === null || data[i - 1].exp === null || data[i - 1].exp === 0)
                      )
                        return d;
                    }
                  }
                }),
              )
              .enter()
              .append("g")
              .attr("class", "tpoint");

            tpoint_g
              .append("circle")
              .attr("class", "tpoint")
              .attr("cx", diffTargetLine.x())
              .attr("cy", diffTargetLine.y())
              .attr("r", 1.5)
              .attr("fill", "#663333");

            // //add clip
            // svg.selectAll("path,circle").attr("clip-path", "url(#clip)");
            /*
             * Zero line
             */
            // svg.append("line")
            //      .attr("x1", 0)
            //      .attr("y1", y(0))
            //      .attr("x2", width)
            //      .attr("y2", y(0))
            //      .attr("stroke-width", 1)
            //      .attr("stroke", "#663333");

            /*
             * Axis
             */
            var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

            if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {
              gx = svg
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

              gy = svg.append("g").attr("class", "y axis").call(yAxis).call(customAxis);

              gy.selectAll("g")
                .filter(function (d) {
                  return d;
                })
                .classed("minor", true);
            } else {
              gx.transition().duration(duration).call(xAxis);

              gy.transition().duration(duration).call(yAxis).call(customAxis);

              gy.selectAll("g")
                .filter(function (d) {
                  return d;
                })
                .classed("minor", true);
            }

            function customAxis(g) {
              g.selectAll("text").attr("x", 4).attr("dy", -4).attr("font-size", "0.85em");
            }

            /*
             * Select only imp & exp data from country selected
             */
            var ComparisonTabData = [];

            data.forEach(function (d) {
              if (d.year >= scope.startDate && d.year <= scope.endDate) {
                if (diffSourceDefined(d)) {
                  ComparisonTabData.push({
                    type: "source",
                    points: diffSource(d),
                    year: d.year,
                  });
                }
                if (diffTargetDefined(d)) {
                  ComparisonTabData.push({
                    type: "target",
                    points: diffTarget(d),
                    year: d.year,
                  });
                }
              }
            });
            voronoi(ComparisonTabData, "points", svg, margin, height, width);
          }

          /*
           * Voronoi fonction
           */
          function voronoi(data, yValue, svg, margin, height, width) {
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

            var voronoiGroup = svg.select(".voronoi");

            if (voronoiGroup.empty()) {
              voronoiGroup = svg
                .append("g")
                .attr("class", "voronoi")
                .attr("fill", "none")
                .attr("pointer-events", "all");
            }

            var voronoiGraph = voronoiGroup.selectAll("path").data(
              voronoi(
                data.filter(function (d) {
                  if (d.points !== "-Infinity" && !isNaN(d.points) && d.points !== undefined) {
                    return d[yValue] !== null;
                  }
                }),
              ),
            );

            voronoiGraph
              .enter()
              .append("path")
              .attr("d", function (data) {
                if (data !== null && data !== undefined && data.length > 1) return "M" + data.join("L") + "Z";
              })
              .datum(function (d) {
                if (d !== undefined) return d.point;
              })
              .on("mouseover", mouseover)
              .on("mouseout", mouseout);

            voronoiGraph.exit().remove();

            /*
             * Mouse interactions
             */

            var focus = svg.select(".focus");

            if (focus.empty()) {
              focus = svg.append("g").attr("transform", "translate(-100,-100)").attr("class", "focus");
            }

            focus.append("circle").attr("r", 3);

            focus.append("text").attr("y", -10).attr("text-anchor", "middle").attr("pointer-events", "none");

            var format = d3.format("0,000");

            function mouseover(d) {
              if (d[yValue] !== null) {
                var colorPoint = d.type === "source" ? "#CC6666" : "#663333";
                focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                focus
                  .select("text")
                  .attr("fill", colorPoint)
                  .text(format(Math.round(d[yValue] * 100) / 100));
              }
              /*
               * Add date
               */
              var text = svg
                .append("text")
                .attr("class", "lineDateText")
                .attr("x", x(new Date(d.year, 0, 1)) - 15)
                .attr("y", 157)
                .attr("font-size", "0.85em")
                .text(d.year)
                .attr("pointer-events", "none");

              /*
               *  Define the gradient
               */
              var gradient = svg
                .append("svg:defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

              /*
               *  Define the gradient colors
               */
              gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", "#f5f5f5").attr("stop-opacity", 0.1);

              gradient.append("svg:stop").attr("offset", "50%").attr("stop-color", "#f5f5f5").attr("stop-opacity", 1);

              gradient
                .append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#f5f5f5")
                .attr("stop-opacity", 0.1);

              /*
               *  Add rect as background to hide date display in
               */
              var bbox = text.node().getBBox();
              var rect = svg
                .append("svg:rect")
                .attr("class", "lineDateText")
                .attr("x", bbox.x - 50)
                .attr("y", bbox.y)
                .attr("width", bbox.width + 100)
                .attr("height", bbox.height)
                .style("fill", "url(#gradient)")
                .attr("pointer-events", "none");

              /*
               * Add date
               */
              var textDate = svg
                .append("text")
                .attr("class", "lineDateText")
                .attr("x", x(new Date(d.year, 0, 1)) - 14)
                .attr("y", 157)
                .attr("font-size", "0.85em")
                .text(d.year)
                .attr("pointer-events", "none");
            }

            function mouseout(d) {
              svg.selectAll("text.lineDateText").remove();
              svg.selectAll("rect.lineDateText").remove();
              focus.attr("transform", "translate(-100,-100)");
            }
          }
        },
      };
    },
  ]);
