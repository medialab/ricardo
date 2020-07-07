"use strict";

/* Directives */
angular
  .module("ricardo.directives.reportingSynth", [])
  /* directive with watch, update and draw functions */
  .directive("reportingSynth", [
    function () {
      return {
        restrict: "E",
        template:
          '<div id="reporting-synth-axis"></div><div id="reporting-synth-container"></div>',
        scope: {
          ngData: "=",
          flowType: "=",
          category: "=",
          loaded: "=",
          partner: "=",
        },
        link: function (scope, element, attrs) {
          scope.$watch("ngData", function (newValue, oldValue) {
            if (newValue && scope.category) {
              var data = group_reporting(newValue, scope.category.type.value);
              draw(data);
            }
          });

          scope.$watch("flowType", function (newValue, oldValue) {
            if (newValue !== oldValue && scope.ngData) {
              yValue = newValue.type.value;
              yName = newValue.name.value;
            }
          });

          scope.$watch("category", function (newValue, oldValue) {
            if (newValue && scope.ngData) {
              category = newValue.type.value;
              categoryName = newValue.name.value;
              var data = group_reporting(scope.ngData, category);
              draw(data);
            }
          });
          scope.$watch("loaded", function (newValue, oldValue) {
            if (newValue === 1) {
              var legend_offset = 0;
              svg_legend
                .selectAll(".legend")
                .attr("transform", function (d, i) {
                  if (i === 0) return "translate(0,10)";
                  else {
                    var prevtext = d3
                      .select(this.previousElementSibling)
                      .select("text")
                      .node()
                      .getBBox();
                    legend_offset = legend_offset + prevtext.width + 20;
                    return "translate(" + legend_offset + ",10)";
                  }
                });
            }
          });

          // var partnerColors = {
          //       "World_best_guess":"#bf6969",
          //        "World sum partners":"#bfbf69" ,
          //        "World as reported":"#69bf69",
          //        "World estimated":"#bf69bf",
          // }

          var margin = { top: 20, right: 15, bottom: 20, left: 180 },
            width =
              document.querySelector("#reporting-synth-container").offsetWidth -
              margin.left -
              margin.right,
            height = 100,
            offsetHeight = 10;

          var minDate, maxDate;
          var yValue = scope.flowType.type.value;
          var yName = scope.flowType.name.value;
          var category = scope.category.type.value;
          var categoryName = scope.category.name.value;

          // var categoryColor=d3.scale.category10()
          var categoryColor = d3.scale
            .ordinal()
            .range([
              "#393b79",
              "#ad494a",
              "#bd9e39",
              "#637939",
              "#7b4173",
              "#003c30",
              "#543005",
              "#6b6ecf",
              "#e7ba52",
              "#d6616b",
              "#b5cf6b",
              "#ce6dbd",
              "#35978f",
              "#bf812d",
            ]);
          var scaleColor = d3.scale
            .ordinal()
            .range(["#daafaf", "#cc6666", "#993333", "#663333"]);
          var stack = d3.layout
            .stack()
            .values(function (d) {
              return d.values;
            })
            .x(function (d) {
              return x(new Date(d.year, 0, 1));
            })
            .y(function (d) {
              return d.values.nb_reporting;
            });

          var format = d3.format("0,000");
          var duration = 300;

          var x = d3.time.scale().range([0, width]);

          var y = d3.scale.linear().range([height, 0]);

          var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);

          var yAxis = d3.svg
            .axis()
            .scale(y)
            .orient("right")
            .ticks(2)
            .tickSize(width);
          // .tickFormat(function(d,i){
          //   if(i == 0){
          //     return
          //   }
          //   else return valueFormat(d);
          // })

          function customAxis(g) {
            g.selectAll("text")
              .attr("text-anchor", "start")
              .style("opacity", function (d, i) {
                return i === 0 ? 0 : 1;
              })
              .attr("x", 2)
              .attr("dy", -4)
              .attr("font-size", "0.85em");
            g.selectAll("line").style("stroke", "grey");
          }

          var tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "synth-tooltip")
            .style("width", "160px");

          var tooltip_title = tooltip.append("div").attr("class", "title");
          var tooltip_table = tooltip.append("div").attr("class", "table");

          var svg_legend = d3
            .select("#reporting-synth-axis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", 20)
            .append("g")
            .attr("transform", "translate(" + margin.left + ",0)");
          // .attr("transform", "translate(" + margin.left + ","+margin.top+")");

          var svg = d3
            .select("#reporting-synth-container")
            .append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right)
            .append("g")
            .attr("class", "synth_svg")
            .attr(
              "transform",
              "translate(" + margin.left + "," + margin.top + ")"
            );

          var line = d3.svg
            .line()
            .interpolate("basis")
            .defined(function (d) {
              return d.values.nb_reporting !== 0;
            })
            .x(function (d) {
              return x(new Date(d.key, 0, 1));
            })
            .y(function (d) {
              return y(d.values.nb_reporting);
            });

          var partner_map = {
            0: "World partner only",
            1: "1 - 10",
            10: "10 - 50",
            50: "More than 50",
          };
          var partner_intersect_map = {
            0: "No mirror partner",
            1: "1 - 10",
            10: "10 - 50",
            50: "More than 50",
          };
          var mirror_map = {
            0: "0",
            0.5: "0 - 0.5",
            1: "0.5 - 1",
            // 2:"> 1"
          };
          var world_partner_map = {
            "World estimated": 0,
            "World as reported": 1,
            "World sum partners": 2,
            "World Federico Tena": 3,
            "Multiple world partners": 4,
            // "World estimated|World as reported":3,
            // "World sum partners|World estimated":3,
            // "World sum partners|World as reported":3
          };
          var source_map = {
            Primary: 0,
            Secondary: 1,
            Estimation: 2,
            FedericoTena: 3,
          };
          var type_map = {
            country: 0,
            "city/part_of": 1,
            group: 2,
            colonial_area: 3,
          };
          var continent_map = {
            Europe: 0,
            America: 1,
            Africa: 2,
            Asia: 3,
            Oceania: 4,
            World: 5,
            "?": 6,
          };
          function sort_color(colorBy, color_domain) {
            switch (colorBy) {
              case "reference":
                color_domain.sort(function (a, b) {
                  return d3.ascending(
                    world_partner_map[a],
                    world_partner_map[b]
                  );
                });
                break;
              case "sourcetype":
                color_domain.sort(function (a, b) {
                  return d3.ascending(source_map[a], source_map[b]);
                });
                // case "sourcetype":  color_domain.sort(function(a, b){ return d3.descending(a,b)})
                break;
              case "type":
                color_domain.sort(function (a, b) {
                  return d3.ascending(type_map[a], type_map[b]);
                });
                break;
              case "continent":
                color_domain.sort(function (a, b) {
                  return d3.ascending(continent_map[a], continent_map[b]);
                });
                break;
            }
            return color_domain;
          }
          function group_reporting(_data, curveBy) {
            //deep cp the array of object
            var data = JSON.parse(JSON.stringify(_data));

            if (
              scope.partner.type.value === "world" &&
              data[0].reference !== undefined
            ) {
              data.forEach(function (d) {
                d.reference =
                  d.reference.split("|").length === 1
                    ? d.reference
                    : "Multiple world partners";
              });
            }

            minDate = d3.min(data, function (d) {
              return +d.year;
            });
            maxDate = d3.max(data, function (d) {
              return +d.year;
            });
            if (curveBy === "partner" || curveBy === "partner_intersect") {
              // var max=d3.max(data,function(d){return d.partner.length});
              // var threshold_out=["less than 10","10 to 50","50 to 100","more than 100"]
              var threshold_out = [0, 1, 10, 50];
              var threshold_in = [1, 10, 50];
            } else if (curveBy === "mirror_rate") {
              var threshold_out = [0, 0.5, 1];
              var threshold_in = [0.01, 0.5];
              data = data.filter(function (d) {
                return d[curveBy] !== undefined;
              });
            }

            var thresScale = d3.scale
              .threshold()
              .domain(threshold_in)
              .range(threshold_out);

            var nbReportings = d3
              .nest()
              .key(function (d) {
                if (curveBy === "partner" || curveBy === "partner_intersect")
                  return thresScale(d[curveBy].length);
                else if (curveBy === "mirror_rate")
                  return thresScale(d[curveBy]);
                else return d[curveBy];
              })
              .key(function (d) {
                return d.year;
              })
              .rollup(function (v) {
                return {
                  nb_reporting: v.length,
                };
              })
              .entries(data);
            //extend missing points with null values
            nbReportings.forEach(function (d) {
              // for (var i = $scope.rawMinDate; i<=$scope.rawMaxDate;i++){
              d.values.forEach(function (v) {
                v.key = +v.key;
              });
              for (var i = minDate; i <= maxDate; i++) {
                var years = d.values.map(function (year) {
                  return year.key;
                });
                if (years.indexOf(i) === -1) {
                  d.values.push({
                    key: i,
                    values: {
                      nb_reporting: 0,
                    },
                  });
                }
              }
              //sort by year ascending
              d.values.sort(function (a, b) {
                return a.key - b.key;
              });
            }); //add missing with null
            //sort by category
            nbReportings.sort(function (a, b) {
              if (curveBy === "reference")
                return d3.ascending(
                  world_partner_map[a.key],
                  world_partner_map[b.key]
                );
              else if (curveBy === "type")
                return d3.ascending(type_map[a.key], type_map[b.key]);
              else if (curveBy === "continent")
                return d3.ascending(continent_map[a.key], continent_map[b.key]);
              else return +a.key - +b.key;
            });
            return nbReportings;
          }
          function draw_legend(color_domain) {
            svg_legend.selectAll("*").remove();
            // var title=svg_legend.append("text")
            //           .text("Number of Reportings Color by "+categoryName)
            //           .attr("font-size",11)

            var legend = svg_legend
              .selectAll(".legend")
              .data(color_domain)
              .enter()
              .append("g")
              .attr("class", "legend");
            legend
              .append("rect")
              .attr("width", 10)
              .attr("height", 10)
              .attr("y", -5)
              .style("fill", function (d) {
                return category === "partner" ||
                  category === "partner_intersect"
                  ? scaleColor(d)
                  : categoryColor(d);
              });
            legend
              .append("text")
              .attr("x", 15)
              .attr("y", 5)
              .text(function (d) {
                if (category === "partner") return partner_map[d];
                else if (category === "partner_intersect")
                  return partner_intersect_map[d];
                else if (category === "mirror_rate") return mirror_map[d];
                else return d;
              })
              .attr("font-size", 11);
            var legend_offset = 0;

            svg_legend.selectAll(".legend").attr("transform", function (d, i) {
              if (i === 0) return "translate(0,10)";
              else {
                var prevtext = d3
                  .select(this.previousElementSibling)
                  .select("text")
                  .node()
                  .getBBox();
                legend_offset = legend_offset + prevtext.width + 20;
                return "translate(" + legend_offset + ",10)";
              }
            });
          }
          function draw(data) {
            var layers = stack(data);
            // var minDate=d3.min(data[0].values,function(d){return +d.key});
            // var maxDate=d3.max(data[0].values,function(d){return +d.key});

            var barwidth = Math.floor(width / (maxDate - minDate));
            var maxReporting = d3.max(layers, function (d) {
              return d3.max(d.values, function (v) {
                return v.y0 + v.y;
              });
            });

            var color_domain = data.map(function (d) {
              return d.key;
            });

            if (category === "partner" || category === "partner_intersect") {
              color_domain.sort(function (a, b) {
                return d3.ascending(+a, +b);
              });
              scaleColor.domain(color_domain);
            } else if (category === "reference") {
              categoryColor
                .domain([0, 1, 2, 3, 4])
                .range(["#393b79", "#ad494a", "#bd9e39", "#637939", "#7b4173"]);
            } else {
              color_domain = sort_color(category, color_domain);
              categoryColor
                .domain(color_domain)
                .range([
                  "#393b79",
                  "#ad494a",
                  "#bd9e39",
                  "#637939",
                  "#7b4173",
                  "#003c30",
                  "#543005",
                  "#6b6ecf",
                  "#e7ba52",
                  "#d6616b",
                  "#b5cf6b",
                  "#ce6dbd",
                  "#35978f",
                  "#bf812d",
                ]);
            }

            draw_legend(color_domain);

            x.domain([new Date(minDate, 0, 1), new Date(maxDate, 0, 1)]);
            y.domain([0, maxReporting]);

            svg.selectAll("*").remove();
            // svg.append("text")
            //    .text("↓ Order by")
            //    .attr("text-anchor","end")
            //    .attr("font-size","11px")
            //    .attr("transform","translate(-10,"+(height)+")")
            svg
              .append("text")
              .text("↓ Number of Reporting Years")
              .attr("class", "ordertitle")
              .attr("text-anchor", "end")
              .attr("font-size", "11px")
              .attr("transform", "translate(-10," + (height + 10) + ")")
              .style("stroke", "black");

            var backbar = svg
              .append("g")
              .selectAll(".background")
              .data(d3.range(minDate, maxDate + 1))
              .enter()
              .append("rect")
              .attr("class", "background")
              .attr("x", function (d) {
                return x(new Date(d, 0, 1)) - barwidth / 2;
              })
              .attr("height", height)
              .attr("width", barwidth - 1)
              .style("fill", "lightgrey")
              .style("opacity", 0)
              .attr("pointer-events", "all")
              .on("mouseover", function (d) {
                d3.select(this).style("opacity", 1);
                d3.selectAll(".layer")
                  .selectAll("rect")
                  .filter(function (layer) {
                    return layer.key === d;
                  })
                  .style("opacity", 1);
                tooltip
                  .transition()
                  .style("display", "block")
                  .style("opacity", 0.9);
                var selectBar = data.map(function (layer) {
                  var l = layer.values.filter(function (e) {
                    return e.key === d;
                  });
                  return {
                    key: layer.key,
                    value: l[0].values.nb_reporting,
                  };
                });
                selectBar.sort(function (a, b) {
                  return b.value - a.value;
                });
                selectBar = selectBar.filter(function (d) {
                  return d.value !== 0;
                });
                selectBar.push({
                  key: "Total",
                  value: d3.sum(selectBar, function (d) {
                    return d.value;
                  }),
                });
                tooltip_title.html(
                  "<h5>Number of " + yName + " Reportings in " + d + "</h5"
                );
                // create table
                tooltip_table.html("<p>By " + categoryName + "</p>");
                tooltip_table.select("table").remove();
                var table = tooltip_table.append("table");
                var tr = table
                  .selectAll(".row")
                  .data(selectBar)
                  .enter()
                  .append("tr")
                  .attr("class", "row");
                // create the first column for each segment.
                tr.append("td")
                  .append("svg")
                  .attr("width", "6")
                  .attr("height", "6")
                  .append("rect")
                  .attr("width", "6")
                  .attr("height", "6")
                  .attr("fill", function (d) {
                    if (d.key !== "Total")
                      return category === "partner" ||
                        category === "partner_intersect"
                        ? scaleColor(d.key)
                        : categoryColor(d.key);
                    else return "none";
                  });

                // create the second column for each segment.
                tr.append("td").text(function (d) {
                  if (category === "partner" && d.key !== "Total")
                    return partner_map[d.key];
                  else if (
                    category === "partner_intersect" &&
                    d.key !== "Total"
                  )
                    return partner_intersect_map[d.key];
                  else if (category === "mirror_rate" && d.key !== "Total")
                    return mirror_map[d.key];
                  else return d.key;
                });

                // create the third column for each segment.
                tr.append("td")
                  .text(function (d) {
                    return d.value;
                  })
                  .style("text-align", "right");
              })
              .on("mousemove", function (d) {
                tooltip
                  .style("left", function () {
                    if (d3.event.pageX - margin.left < (9 * width) / 10)
                      return d3.event.pageX + 20 + "px";
                    else return d3.event.pageX - 180 + "px";
                  })
                  .style("top", d3.event.pageY - 100 + "px");
                //  //tick highlighting
                var text = svg
                  .append("text")
                  .attr("class", "highlight")
                  .attr("x", x(new Date(d, 0, 1)))
                  .attr("y", height + 17)
                  .attr("font-size", "0.85em")
                  .attr("text-anchor", "middle")
                  .text(d);

                // Define the gradient
                var gradient = svg
                  .append("svg:defs")
                  .append("svg:linearGradient")
                  .attr("id", "gradient")
                  .attr("x1", "0%")
                  .attr("y1", "100%")
                  .attr("x2", "100%")
                  .attr("y2", "100%")
                  .attr("spreadMethod", "pad");

                // Define the gradient colors
                gradient
                  .append("svg:stop")
                  .attr("offset", "0%")
                  .attr("stop-color", "#f5f5f5")
                  .attr("stop-opacity", 0.1);

                gradient
                  .append("svg:stop")
                  .attr("offset", "50%")
                  .attr("stop-color", "#f5f5f5")
                  .attr("stop-opacity", 1);

                gradient
                  .append("svg:stop")
                  .attr("offset", "100%")
                  .attr("stop-color", "#f5f5f5")
                  .attr("stop-opacity", 0.1);

                // add rect as background to hide date display in
                var bbox = text.node().getBBox();
                var rect = svg
                  .append("svg:rect")
                  .attr("class", "highlight")
                  .attr("x", bbox.x - 20)
                  .attr("y", bbox.y)
                  .attr("width", bbox.width + 40)
                  .attr("height", bbox.height)
                  .style("fill", "url(#gradient)");
                svg
                  .append("text")
                  .attr("class", "highlight")
                  .attr("x", x(new Date(d, 0, 1)))
                  .attr("y", height + 17)
                  .attr("font-size", "0.85em")
                  .attr("text-anchor", "middle")
                  .text(d);
              })
              .on("mouseout", function (d) {
                d3.select(this).style("opacity", 0);
                d3.selectAll(".layer").selectAll("rect").style("opacity", 0.7);
                tooltip.transition().style("display", "none");
                svg.selectAll(".highlight").remove();
              });

            var layer = svg
              .selectAll(".layer")
              .data(layers)
              .enter()
              .append("g")
              .attr("class", "layer")
              .style("fill", function (d) {
                return category === "partner" ||
                  category === "partner_intersect"
                  ? scaleColor(d.key)
                  : categoryColor(d.key);
              });

            var indexIter = d3.range(0, 154).map(function (d) {
              return d * 0;
            });
            var indexIterH = d3.range(0, 154).map(function (d) {
              return d * 0;
            });

            layer.each(function (data, index) {
              var e = d3.select(this);
              e.selectAll("rect")
                .data(data.values)
                .enter()
                .append("rect")
                .attr("x", function (d) {
                  return x(new Date(d.key, 0, 1)) - barwidth / 2;
                })
                .attr("y", function (d, i) {
                  if (index !== 0 && layers[index - 1].values[i].y === 0)
                    indexIter[i] += 1;
                  if (d.y > 0 && y(d.y0) - y(d.y + d.y0) < 2)
                    indexIterH[i] += 2 - (y(d.y0) - y(d.y + d.y0));
                  return (
                    y(d.y + d.y0) - 2 * (index - indexIter[i]) - indexIterH[i]
                  );
                })
                .attr("height", function (d) {
                  if (y(d.y0) - y(d.y + d.y0) === 0)
                    return y(d.y0) - y(d.y + d.y0);
                  else return d3.max([y(d.y0) - y(d.y + d.y0), 2]);
                  // return y(d.y0) - y(d.y + d.y0)
                  // if((y(d.y0) - y(d.y + d.y0))<=2) return 2;
                  // else return y(d.y0) - y(d.y + d.y0);
                })
                .attr("width", barwidth - 1)
                .style("opacity", function (d) {
                  return category === "partner" ||
                    category === "partner_intersect"
                    ? 0.8
                    : 0.7;
                })
                .attr("pointer-events", "none");
            });
            // layer.selectAll("rect")
            //     .data(function(d) { return d.values; })
            //     .enter().append("r ect")
            //     .attr("x", function(d) { return x(new Date(d.key,0,1))-barwidth/2; })
            //     .attr("y", function(d) {
            //       return y(d.y + d.y0)-2
            //       // if((y(d.y0) - y(d.y + d.y0))<=2) return 2;
            //       // if((d.y+d.y0)===0) return y(d.y + d.y0)+2;
            //       // else return y(d.y + d.y0);
            //     })
            //     .attr("height", function(d) {
            //       return y(d.y0) - y(d.y + d.y0);
            //       // if((y(d.y0) - y(d.y + d.y0))<=2) return 2;
            //       // else return y(d.y0) - y(d.y + d.y0);
            //     })
            //     .attr("width", barwidth-1)
            //     .style("opacity",function(d){return category==="partner" || category==="mirror_rate" ? 0.8:0.7;})
            //     .attr("pointer-events","none")

            // var multi_g=svg.selectAll(".multiple")
            //                 .data(data)
            //         multi_g.enter()
            //               .append("g")
            //               .attr("class", "multiple")
            //               .each(function(d,i) {
            //                 var e = d3.select(this);
            //                 // e.append("path")
            //                 //       .attr("class", "area-total")
            //                 //       .attr("d", function(d) { return area(d.values); })
            //                 //       .style("pointer-events","none")
            //                 e.append("path")
            //                         .attr("class", "line")
            //                         .attr("d", function(d) {return line(d.values); })
            //                         .style("fill","none")
            //                         .style("stroke",function(){return category==="partner"? scaleColor(d.key):categoryColor(d.key) })
            //                         .style("stroke-width", 1.5)
            //                         .style("pointer-events","none")
            //               })
            svg
              .append("g")
              .attr("class", "y axis")
              .call(yAxis)
              .call(customAxis)
              .style("pointer-events", "none");

            svg
              .append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
              .style("pointer-events", "none");
          } //end draw function
        },
      };
    },
  ]);
