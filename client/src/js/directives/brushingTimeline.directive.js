import * as d3 from "d3";

angular
  .module("ricardo.directives.brushingTimeline", [])

  /* directive with watch and draw function */
  .directive("brushingTimeline", [
    function () {
      return {
        restrict: "E",
        scope: {
          ngData: "=",
          startDate: "=",
          endDate: "=",
          rawStartDate: "=",
          rawEndDate: "=",
          sourceCountry: "=",
          targetCountry: "=",
          mirrorLines: "@",
        },
        link: function (scope, element, attrs) {
          // Manage the lifecycle of the container
          const rootElement = element[0];
          const container = d3.select(rootElement).append("div").attr("id", "brushing-timeline-container");
          element.on("$destroy", function () {
            d3.select("#brushing-timeline-container").remove();
          });

          scope.mirrorLines = !!scope.mirrorLines;

          scope.$watchCollection("[ngData, startDate,endDate]", function (newValue, oldValue) {
            if (newValue[0]) {
              d3.select("#brushing-timeline-container > svg").remove();
              draw(newValue[0], newValue[1], newValue[2]);
            }
          });

          var margin = { top: 6, right: 0, bottom: 6, left: 0 },
            width = rootElement.offsetWidth - margin.left - margin.right,
            svgHeight = scope.mirrorLines ? 140 : 70,
            height = 20,
            hOffset = svgHeight - height - margin.bottom - margin.top,
            interline = 8,
            baselineHeight_1on1 = hOffset / 2,
            baselineHeight_1on2 = scope.mirrorLines ? hOffset / 4 : baselineHeight_1on1,
            baselineHeight_2on2 = (3 * hOffset) / 4;

          // Curve
          var x = d3.time.scale().range([0, width]);

          var y = d3.scale.linear().range([height, 0]);

          var xAxis = d3.svg.axis().scale(x).orient("bottom");

          /* avaible data */

          var availImp = d3.svg
            .line()
            .defined(function (d) {
              return d.imp !== null;
            })
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return baselineHeight_1on2 - interline / 2;
            });

          var availExp = d3.svg
            .line()
            .defined(function (d) {
              return d.exp !== null;
            })
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return baselineHeight_1on2 + interline / 2;
            });

          var availImpMirror = d3.svg
            .line()
            .defined(function (d) {
              return d.imp_mirror !== null;
            })
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return baselineHeight_2on2 - interline / 2;
            });

          var availExpMirror = d3.svg
            .line()
            .defined(function (d) {
              return d.exp_mirror !== null;
            })
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return baselineHeight_2on2 + interline / 2;
            });

          function draw(data, startDate, endDate) {
            var svg = container
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", svgHeight + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            data.forEach(function (d) {
              d.date = new Date(d.year, 0, 1);
            });

            x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
            y.domain([
              0,
              d3.max(data, function (d) {
                return Math.max(d.imp, d.exp);
              }),
            ]);

            // baselines

            var entityDataAvaible = scope.sourceCountry ? scope.sourceCountry : "World";

            svg
              .append("text")
              .attr("class", "baselineLabel")
              .text(entityDataAvaible)
              .attr("x", 0)
              .attr("y", baselineHeight_1on2 - interline / 2 - 8);

            svg
              .append("line")
              .attr("class", "importBaseline")
              .attr("x1", 0)
              .attr("y1", baselineHeight_1on2 - interline / 2)
              .attr("x2", width)
              .attr("y2", baselineHeight_1on2 - interline / 2);

            svg
              .append("line")
              .attr("class", "exportBaseline")
              .attr("x1", 0)
              .attr("y1", baselineHeight_1on2 + interline / 2)
              .attr("x2", width)
              .attr("y2", baselineHeight_1on2 + interline / 2);

            if (scope.mirrorLines) {
              svg
                .append("text")
                .attr("class", "baselineLabel")
                .text(scope.targetCountry)
                .attr("x", 0)
                .attr("y", baselineHeight_2on2 - interline / 2 - 8);

              svg
                .append("line")
                .attr("class", "importBaseline")
                .attr("x1", 0)
                .attr("y1", baselineHeight_2on2 - interline / 2)
                .attr("x2", width)
                .attr("y2", baselineHeight_2on2 - interline / 2);

              svg
                .append("line")
                .attr("class", "exportBaseline")
                .attr("x1", 0)
                .attr("y1", baselineHeight_2on2 + interline / 2)
                .attr("x2", width)
                .attr("y2", baselineHeight_2on2 + interline / 2);

              svg.append("path").datum(data).attr("class", "line-imp").attr("d", availImpMirror);

              svg.append("path").datum(data).attr("class", "line-exp").attr("d", availExpMirror);

              svg
                .selectAll(".ipoint_mirror")
                .data(
                  data.filter(function (d, i) {
                    if (d.imp_mirror !== null) {
                      if (i === 0) {
                        if (data[i + 1].imp_mirror === null) return d;
                      } else if (i === data.length - 1) {
                        if (data[i - 1].imp_mirror === null) return d;
                      } else {
                        if (data[i - 1].imp_mirror === null && data[i + 1].imp_mirror === null) return d;
                      }
                    }
                  }),
                )
                .enter()
                .append("circle")
                .attr("class", "ipoint_mirror")
                .attr("cx", availImpMirror.x())
                .attr("cy", availImpMirror.y())
                .attr("r", 1.5)
                .attr("fill", "#cc6666");

              svg
                .selectAll(".epoint_mirror")
                .data(
                  data.filter(function (d, i) {
                    if (d.exp_mirror !== null) {
                      if (i === 0) {
                        if (data[i + 1].exp_mirror === null) return d;
                      } else if (i === data.length - 1) {
                        if (data[i - 1].exp_mirror === null) return d;
                      } else {
                        if (data[i - 1].exp_mirror === null && data[i + 1].exp_mirror === null) return d;
                      }
                    }
                  }),
                )
                .enter()
                .append("circle")
                .attr("class", "epoint")
                .attr("cx", availExpMirror.x())
                .attr("cy", availExpMirror.y())
                .attr("r", 1.5)
                .attr("fill", "#663333");
            }

            svg.append("path").datum(data).attr("class", "line-imp").attr("d", availImp);

            svg.append("path").datum(data).attr("class", "line-exp").attr("d", availExp);

            // add discrete points
            svg
              .selectAll(".ipoint")
              .data(
                data.filter(function (d, i) {
                  if (d.imp !== null) {
                    if (i === 0) {
                      if (data[i + 1] && data[i + 1].imp === null) return d;
                    } else if (i === data.length - 1) {
                      if (data[i - 1].imp === null) return d;
                    } else {
                      if (data[i - 1].imp === null && data[i + 1].imp === null) return d;
                    }
                  }
                }),
              )
              .enter()
              .append("circle")
              .attr("class", "ipoint")
              .attr("cx", availImp.x())
              .attr("cy", availImp.y())
              .attr("r", 1.5)
              .attr("fill", "#cc6666");

            svg
              .selectAll(".epoint")
              .data(
                data.filter(function (d, i) {
                  if (d.exp !== null) {
                    if (i === 0) {
                      if (data[i + 1] && data[i + 1].exp === null) return d;
                    } else if (i === data.length - 1) {
                      if (data[i - 1].exp === null) return d;
                    } else {
                      if (data[i - 1].exp === null && data[i + 1].exp === null) return d;
                    }
                  }
                }),
              )
              .enter()
              .append("circle")
              .attr("class", "epoint")
              .attr("cx", availExp.x())
              .attr("cy", availExp.y())
              .attr("r", 1.5)
              .attr("fill", "#663333");

            /* axis */

            var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

            if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {
              gx = svg
                .append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (hOffset + height) + ")")
                .call(xAxis);
            } else {
              gx.transition().duration(duration).call(xAxis);
            }

            function customAxis(g) {
              g.selectAll("text").attr("x", 4).attr("dy", -4).attr("font-size", "0.85em");
            }
          }
        },
      };
    },
  ]);
