import * as d3 from "d3";

angular
  .module("ricardo.directives.brushingTimeline", [])

  /* directive with watch and draw function */
  .directive("brushingTimeline", [
    function () {
      return {
        restrict: "E",
        replace: false,
        template: '<div id="brushing-timeline-container"></div>',
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
          scope.mirrorLines = !!scope.mirrorLines;

          scope.$watch("ngData", function (newValue, oldValue) {
            if (newValue) {
              draw(scope.ngData);
            }
          });

          scope.$watchCollection("[startDate,endDate]", function (newValue, oldValue) {
            if (newValue[0] && newValue[1] && scope.ngData) {
              updateBrush();
            }
          });

          var margin = { top: 6, right: 0, bottom: 6, left: 0 },
            width = document.querySelector("#brushing-timeline-container").offsetWidth - margin.left - margin.right,
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
          var brush = d3.svg.brush().x(x);

          function draw(data) {
            d3.select("#brushing-timeline-container").select("svg").remove();

            var svg = d3
              .select("#brushing-timeline-container")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", svgHeight + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            data.forEach(function (d) {
              d.date = new Date(d.year, 0, 1);
            });
            
            x.domain(
              [new Date(scope.rawStartDate, 0, 1), new Date(scope.rawEndDate, 0, 1)]
            );
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

            // Brush
            brush
              .on("brush", function () {
                if (brush.empty()) {
                  brush.clear();
                }
              })
              .on("brushend", brushended);
            
            // first update to apply potential date selections retrieved from URL
            updateBrush();

            function brushended() {
              if (!d3.event.sourceEvent) return; // only transition after input

              var extent0 = brush.extent(),
                extent1 = extent0.map(function (d) {
                  return d3.time.year(new Date(d));
                });

              d3.select(this).transition().call(brush.extent(extent1)).call(brush.event);

              if (brush.empty()) {
                brush.extent(x.domain());
              }

              applyBrush();
            }
            //selection.selectAll("g.brush").remove();
            var gBrush = svg.select(".brush");

            if (gBrush.empty()) {
              gBrush = svg.append("g").attr("class", "brush").call(brush).call(brush.event);

              gBrush.selectAll("rect").attr("height", svgHeight);
            } else {
              gBrush.call(brush).call(brush.event);
            }

            function applyBrush() {
              scope.startDate = brush.extent()[0].getFullYear();
              scope.endDate = brush.extent()[1].getFullYear();
              if (!scope.$$phase) {
                scope.$apply();
              }
            }
          }

          function updateBrush() {
            brush.extent([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
            if (scope.rawStartDate === scope.startDate && scope.rawEndDate === scope.endDate) {
              brush.clear();
            }
            d3.select("#brushing-timeline-container svg").select(".brush").call(brush);
          }
        },
      };
    },
  ]);
