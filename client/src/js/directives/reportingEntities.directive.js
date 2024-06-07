/* Directives */
angular
  .module("ricardo.directives.reportingEntities", [])
  /* directive with watch, update and draw functions */
  .directive("reportingEntities", [
    function () {
      return {
        restrict: "E",
        template: '<div id="reporting-entities-container"></div>',
        scope: {
          flatData: "=",
          ngData: "=",
          flowType: "=",
          color: "=",
          layout: "=",
          reporting: "=",
          search: "=",
        },
        link: function (scope, element, attrs) {
          scope.$watch("ngData", function (newValue, oldValue) {
            if (newValue) {
              draw(newValue);
            }
          });
          scope.$watch("flowType", function (newValue, oldValue) {
            if (newValue !== oldValue && scope.ngData) {
              yValue = newValue.type.value;
              yName = newValue.name.value;
              draw(scope.ngData);
              indexSelected = null;
            }
          });
          scope.$watch("layout", function (newValue, oldValue) {
            if (newValue && scope.ngData) {
              layout = newValue.type.value;
              layoutName = newValue.name.value;
              var data = order(layout, scope.ngData);
              reorder(data);
              indexSelected = null;
            }
          });
          scope.$watch("color", function (newValue, oldValue) {
            if (newValue !== oldValue) {
              colorBy = newValue.type.value;
              colorName = newValue.name.value;
              recolor(colorBy, scope.ngData);
            }
          });

          scope.$watch("search", function (newValue, oldValue) {
            if (newValue) {
              var offsetDiv = $("#reporting-entities-container").offset().top;
              var offsetTop = d3
                .select("#r_" + scope.reporting)
                .node()
                .getCTM().f;

              //clear hightlight
              d3.selectAll(".entities")
                .selectAll(".rlabel")
                .style("stroke", "none")
                .attr("y", 8)
                .attr("font-size", "11px");
              d3.selectAll(".entities").selectAll(".overlay").style("fill", "none");
              d3.selectAll(".entities")
                .selectAll(".overlay,.coverage_rect")
                .attr("height", gridHeight - gridGap);
              d3.selectAll(".entities")
                .selectAll(".available")
                .selectAll("circle")
                .attr("cy", function (v) {
                  return gridHeight / 2;
                });
              d3.selectAll(".entities")
                .selectAll(".available")
                .selectAll("rect")
                .attr("height", gridHeight - gridGap);
              d3.selectAll(".entities").attr("transform", function (d) {
                return "translate(0 ," + y(d.key) + ")";
              });

              //highlight searched
              d3.select("#r_" + scope.reporting)
                .selectAll(".rlabel")
                .style("stroke", "black")
                .attr("y", 15)
                .attr("font-size", "14px");
              d3.select("#r_" + scope.reporting)
                .selectAll(".overlay")
                .style("fill", "lightgrey");
              d3.select("#r_" + scope.reporting)
                .selectAll(".overlay,.coverage_rect")
                .attr("height", gridHeight - gridGap + 15);
              d3.select("#r_" + scope.reporting)
                .selectAll(".available")
                .selectAll("circle")
                .attr("cy", (gridHeight - gridGap + 15) / 2);
              d3.select("#r_" + scope.reporting)
                .selectAll(".available")
                .selectAll("rect")
                .attr("height", gridHeight - gridGap + 15);
              $("#reporting-entities-container").animate({ scrollTop: offsetTop - 300 }, 500);

              d3.selectAll(".entities")
                .filter(function (e) {
                  var key = d3.select("#r_" + scope.reporting).datum().key;
                  return y(e.key) > y(key);
                })
                .attr("transform", function (e) {
                  var curTransform = d3.select(this).attr("transform");
                  var curXPos = +curTransform.split(",")[0].replace("translate(", "");
                  var curYPos = +curTransform.split(",")[1].replace(")", "");
                  return "translate(" + curXPos + "," + (curYPos + 15) + ")";
                });
              // searchFixed=true;
              indexSelected = y.domain().indexOf(d3.select("#r_" + scope.reporting).datum().key);
            }
          });

          element.on("$destroy", function () {
            d3.select("#reporting-entities-container").selectAll("*").remove();
          });

          function regroup(colorBy) {
            var yearData = scope.flatData.sort(function (a, b) {
              if (colorBy === "partner") return d3.descending(a[colorBy].length, b[colorBy].length);
              else return d3.descending(a[colorBy], b[colorBy]);
            });
            var years = d3
              .nest()
              .key(function (d) {
                return d;
              })
              .rollup(function (values) {
                return values.length - 1;
              })
              .map(d3.range(1786, 1938));

            d3.selectAll(".available")
              .data(yearData)
              .attr("height", 4)
              .style("fill", function (d) {
                if (
                  colorBy === "type" ||
                  colorBy === "continent" ||
                  colorBy === "sourcetype" ||
                  colorBy === "reference"
                )
                  return categoryColor(d[colorBy]);
                else return scaleColor(d[colorBy].length);
              })
              .style("opacity", 0.7)
              .attr("x", function (d) {
                return x(new Date(d.year, 0, 1));
              })
              .attr("y", function (d) {
                var topping = years[+d.year];
                years[+d.year] += 1;
                if (topping) return topping * 5;
              });
          }
          var world_partner_map = {
            "World estimated": 0,
            "World as reported": 1,
            "World sum partners": 2,
            "World Federico Tena": 3,
            "World estimated|World as reported": 4,
            "World sum partners|World estimated": 4,
            "World sum partners|World as reported": 4,
            "World as reported|World Federico Tena": 4,
            "World sum partners|World Federico Tena": 4,
            "World estimated|World Federico Tena": 4,
            "World Federico Tena|World as reported": 4,
          };
          var source_map = {
            Primary: 0,
            Secondary: 1,
            Estimation: 2,
            "Federico Tena": 3,
          };
          var type_map = {
            GPH_entity: 0,
            "locality": 1,
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
          var continentColors = {
            Europe: "#bf6969",
            Asia: "#bfbf69",
            Africa: "#69bfbf",
            America: "#69bf69",
            World: "#bf69bf",
            Oceania: "#6969bf",
            Pacific: "#637939",
            Mediterranean: "#7b4173",
            Baltic: "#35978f",
            Antarctic: "#bf812d",
            "Atlantic Ocean": "#ce6dbd",
          };
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
          function colorByContinent(continent) {
            return continentColors[continent];
          }

          var yValue = scope.flowType.type.value;
          var yName = scope.flowType.name.value;
          var layout = scope.layout.type.value;
          var layoutName = scope.layout.name.value;
          var colorBy = scope.color.type.value;
          var colorName = scope.color.name.value;

          var indexSelected = null;
          var yearSelected = null;

          var margin = { top: 0, right: 13, bottom: 40, left: 180 },
            width = document.querySelector("#reporting-entities-container").offsetWidth - margin.left - margin.right,
            height,
            offset = 30,
            orders;
          var svg_g = d3.select("#reporting-entities-container").append("svg");

          var gridHeight = 10,
            gridGap = 1,
            gridWidth;

          var legendWidth = 60;

          var x = d3.time.scale().range([0, width]);

          var y = d3.scale.ordinal();
          var z = d3.scale.linear().range([0.2, 1]);
          var scaleColor;
          var numScale = d3.scale.linear();

          var marginScale = d3.scale.linear().range([margin.left - offset, 5]);

          var xAxis = d3.svg.axis().scale(x).orient("top").ticks(10);

          var numAxis = d3.svg
            .axis()
            .scale(numScale)
            .orient("left")
            .ticks(4)
            .tickFormat(function (d, i) {
              if (i == 0) {
                return;
              } else return d;
            });

          function valueFormat(d) {
            var prefix = d3.formatPrefix(d);
            var symbol;
            if (layout === "flowAvg" || colorBy === "flow") {
              if (prefix.symbol === "G") {
                symbol = "b";
              } else if (prefix.symbol === "M") {
                symbol = "m";
              } else if (prefix.symbol === "k") {
                symbol = "k";
              } else {
                symbol = "";
              }
              return d3.round(prefix.scale(d)) + " " + symbol;
            } else return d;
          }

          //////////////////////////////////////////////////////
          ////////////////// Tooltips Setup //////////////////
          //////////////////////////////////////////////////////
          var tooltip = d3.select("body").append("div").attr("class", "matrix-tooltip").style("width", "200px");
          var tooltip_margin = d3.select("body").append("div").attr("class", "matrix-tooltip");

          var tip_margin = { top: 10, right: 0, bottom: 10, left: 0 },
            tip_width = document.querySelector(".matrix-tooltip").offsetWidth - tip_margin.left - tip_margin.right;
          tooltip.append("div").attr("class", "title");
          tooltip.append("div").attr("class", "tip_svg");
          tooltip.append("div").attr("class", "table");
          tooltip.append("div").attr("class", "reference");
          tooltip.append("div").attr("class", "source");
          var x_tip = d3.scale.linear().range([0, tip_width - 40]);
          var y_tip = d3.scale.ordinal().rangeRoundBands([0, 100]);

          var searchFixed = false;
          // Precompute the orders.

          var countByType = [];
          var countByContinent = [];

          function updateColor(colorBy, data) {
            if (colorBy === "partner" || colorBy === "partner_intersect") {
              var threshold_in = [1, 10, 50];
              var threshold_color = ["#daafaf", "#cc6666", "#993333", "#663333"];

              scaleColor = d3.scale.threshold().domain(threshold_in).range(threshold_color);
            } else if (colorBy === "mirror_rate") {
              var threshold_in = [0.01, 0.5];
              var threshold_color = ["#daafaf", "#cc6666", "#993333"];

              scaleColor = d3.scale.threshold().domain(threshold_in).range(threshold_color);
            } else {
              var color_domain = [];
              data.forEach(function (d) {
                d.values.forEach(function (v) {
                  color_domain.push(v[colorBy]);
                });
              });
              if (colorBy === "reference") {
                categoryColor.domain([0, 1, 2, 3, 4]).range(["#393b79", "#ad494a", "#bd9e39", "#637939", "#7b4173"]);
              } else {
                console.log(color_domain, d3.set(color_domain).values())
                color_domain = sort_color(colorBy, d3.set(color_domain).values());
                console.log(color_domain)
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
            }
          }
          function recolor(colorBy, data) {
            updateColor(colorBy, data);
            d3.selectAll(".available")
              .selectAll("circle")
              .style("fill", function (v) {
                if (colorBy === "type" || colorBy === "continent" || colorBy === "sourcetype")
                  return categoryColor(v[colorBy]);
                else if (colorBy === "reference") return categoryColor(world_partner_map[v[colorBy]]);
                else if (colorBy === "mirror_rate")
                  return v.mirror_rate !== undefined ? scaleColor(v[colorBy]) : "none";
                else return scaleColor(v[colorBy].length);
              });
          }
          function sort_color(colorBy, color_domain) {
            switch (colorBy) {
              case "reference":
                color_domain.sort(function (a, b) {
                  return d3.ascending(world_partner_map[a], world_partner_map[b]);
                });
                break;
              case "sourcetype":
                color_domain.sort(function (a, b) {
                  return d3.ascending(source_map[a], source_map[b]);
                });
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
            return [...color_domain];
          }
          function order(layout, data) {
            switch (layout) {
              case "years":
                data.sort(function (a, b) {
                  return d3.descending(a.values.length, b.values.length);
                });
                break;
              case "partnerAvg":
                data.sort(function (a, b) {
                  return d3.descending(a.partnerAvg, b.partnerAvg);
                });
                break;
              case "flowAvg":
                data.sort(function (a, b) {
                  return d3.descending(a.flowAvg, b.flowAvg);
                });
                break;
              case "alphabet":
                data.sort(function (a, b) {
                  return d3.ascending(a.key, b.key);
                });
                break;
              case "continent":
                data.forEach(function (d) {
                  d.order = continentMap[d.values[0].continent];
                });
                data.sort(function (a, b) {
                  if (a.order === b.order) return d3.descending(a.values.length, b.values.length);
                  else return d3.ascending(a.order, b.order);
                });
                break;
              case "type":
                data.forEach(function (d) {
                  d.order = typeMap[d.values[0].type];
                });
                data.sort(function (a, b) {
                  if (a.order === b.order) return d3.descending(a.values.length, b.values.length);
                  else return d3.ascending(a.order, b.order);
                });
                break;
            }
            return data;
          }
          function reorder(data) {
            var reportings = data.map(function (d) {
              return d.key;
            });
            y.domain(reportings);
            marginScale.domain([
              0,
              d3.max(data, function (d) {
                return d[layout];
              }),
            ]);
            d3.select("#reporting-synth-container")
              .select(".ordertitle")
              .text("↓ " + layoutName);
            d3.select("#reporting-entities-container")
              .selectAll(".entities")
              .transition()
              .duration(500)
              .attr("transform", function (d) {
                return "translate(0 ," + y(d.key) + ")";
              });
            if (layout === "alphabet") {
              d3.select("#reporting-entities-container")
                .selectAll(".entities")
                .selectAll(".rlabel")
                .attr("pointer-events", "all");
              d3.select("#reporting-entities-container")
                .selectAll(".entities")
                .selectAll(".coverage_rect")
                .style("display", "none");
            } else {
              d3.select("#reporting-entities-container")
                .selectAll(".entities")
                .selectAll(".rlabel")
                .attr("pointer-events", "none");
              d3.select("#reporting-entities-container")
                .selectAll(".entities")
                .selectAll(".coverage_rect")
                .style("display", "block")
                .attr("x", function (d) {
                  return d3.min([marginScale(d[layout]), margin.left - offset - 10]);
                })
                .attr("width", function (d) {
                  return d3.max([margin.left - offset - marginScale(d[layout]), 10]);
                });
              d3.select("#reporting-entities-container")
                .selectAll(".entities")
                .selectAll(".barLabel")
                .attr("x", function (d) {
                  return d3.min([marginScale(d[layout]), margin.left - offset - 10]);
                })
                .text(function (d) {
                  return valueFormat(d[layout]);
                });
            }
          }
          function draw(data) {
            var svg_g = d3.select("#reporting-entities-container").append("svg");
            data = order(layout, data);
            updateColor(colorBy, data);
            marginScale.domain([
              0,
              d3.max(data, function (d) {
                return d[layout];
              }),
            ]);

            var minDate = d3.min(scope.flatData, function (d) {
              return +d.year;
            });
            var maxDate = d3.max(scope.flatData, function (d) {
              return +d.year;
            });
            var years = d3.range(minDate, maxDate);

            var reportings = data.map(function (d) {
              return d.key;
            });

            height = gridHeight * reportings.length;
            gridWidth = width / (maxDate - minDate);

            var svg = svg_g
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([new Date(minDate, 0, 1), new Date(maxDate, 0, 1)]);
            y.domain(reportings).rangeRoundBands([0, height]);

            var matrix = svg
              .append("g")
              .attr("class", "matrix")
              .attr("transform", "translate(0 ," + gridGap + ")");

            var entity = matrix
              .append("g")
              .selectAll(".entities")
              .data(data)
              .enter()
              .append("g")
              .attr("class", "entities")
              .attr("id", function (d) {
                return "r_" + d.values[0].reporting_id;
              })
              .attr("transform", function (d) {
                return "translate(0 ," + y(d.key) + ")";
              });

            entity
              .on("mouseover", function (d, i) {
                if (!searchFixed) {
                  var entityRemoved = d3.selectAll(".entities").filter(function (e) {
                    return e.key === y.domain()[indexSelected];
                  });
                  keyRemoveHighlight(entityRemoved);
                  indexSelected = y.domain().indexOf(d.key);
                  d3.select(this).selectAll(".rlabel").style("stroke", "black").attr("y", 15).attr("font-size", "14px");
                  d3.select(this).selectAll(".overlay").style("fill", "lightgrey");
                  d3.select(this)
                    .selectAll(".overlay,.coverage_rect")
                    .attr("height", gridHeight - gridGap + 15);
                  d3.select(this)
                    .selectAll(".available")
                    .selectAll("circle")
                    .attr("cy", (gridHeight - gridGap + 15) / 2);
                  d3.select(this)
                    .selectAll(".available")
                    .selectAll("rect")
                    .attr("height", gridHeight - gridGap + 15);
                  d3.selectAll(".entities")
                    .filter(function (e) {
                      return y(e.key) > y(d.key);
                    })
                    .attr("transform", function (e) {
                      var curTransform = d3.select(this).attr("transform");
                      var curXPos = +curTransform.split(",")[0].replace("translate(", "");
                      var curYPos = +curTransform.split(",")[1].replace(")", "");
                      return "translate(" + curXPos + "," + (curYPos + 15) + ")";
                    });
                }
              })
              .on("mouseout", function (d) {
                if (!searchFixed) {
                  d3.select(this).selectAll(".rlabel").style("stroke", "none").attr("y", 8).attr("font-size", "11px");
                  d3.select(this).selectAll(".overlay").style("fill", "none");
                  d3.select(this)
                    .selectAll(".overlay,.coverage_rect")
                    .attr("height", gridHeight - gridGap);
                  d3.select(this)
                    .selectAll(".available")
                    .selectAll("circle")
                    .attr("cy", function (v) {
                      return gridHeight / 2;
                    });
                  d3.select(this)
                    .selectAll(".available")
                    .selectAll("rect")
                    .attr("height", gridHeight - gridGap);
                  d3.selectAll(".entities").attr("transform", function (d) {
                    return "translate(0 ," + y(d.key) + ")";
                  });
                }
              });
            entity.each(function (d) {
              var e = d3.select(this);
              e.append("rect")
                .attr("class", "overlay")
                // .attr("x",-5)
                .attr("width", width + gridWidth / 2)
                .attr("height", gridHeight - gridGap)
                .style("fill", "none")
                .style("opacity", "0.7")
                .style("pointer-events", "all");
              //test circle for matrix layout
              var available = e
                .append("g")
                .selectAll(".available")
                .data(d.values)
                .enter()
                .append("g")
                .attr("class", "available");
              available
                .append("rect")
                .attr("x", function (v) {
                  return x(new Date(v.year, 0, 1));
                })
                .attr("width", gridWidth - gridGap)
                .attr("height", gridHeight - gridGap)
                .style("fill", "none")
                .style("pointer-events", "all");
              available
                .append("circle")
                .attr("cx", function (v) {
                  return x(new Date(v.year, 0, 1));
                })
                .attr("cy", function (v) {
                  return gridHeight / 2;
                })
                .attr("r", gridWidth / 2)
                .style("fill", function (v) {
                  if (colorBy === "type" || colorBy === "continent" || colorBy === "sourcetype")
                    return categoryColor(v[colorBy]);
                  else if (colorBy === "reference") return categoryColor(world_partner_map[v[colorBy]]);
                  else if (colorBy === "mirror_rate") return scaleColor(v[colorBy]);
                  else return scaleColor(v[colorBy].length);
                })
                .style("opacity", 0.7)
                .style("pointer-events", "none");
              available
                .on("mouseover", function (v) {
                  d3.selectAll(".available").selectAll("circle").style("stroke", "none").style("opacity", 0.7);
                  d3.select(this).select("circle").style("stroke", "black").style("opacity", 1);
                  yearSelected = +v.year;
                  tooltip.transition().style("display", "block").style("opacity", 0.9);
                  tooltipContext(tooltip, v);
                })
                .on("mouseout", function () {
                  d3.select(this).select("circle").style("stroke", "none").style("opacity", 0.7);
                  tooltip.transition().style("display", "none");
                  d3.select("#reporting-synth-container").selectAll(".highlight,#gradient").remove();
                })
                .on("mousemove", function (v) {
                  var wid = tooltip.style("width").replace("px", "");
                  tooltip
                    .style("display", "block")
                    .style("left", Math.min(window.innerWidth, Math.max(0, d3.event.pageX)) - wid / 2 + "px")
                    .style("top", d3.event.pageY + 40 + "px");
                  gradientHighlight(v.year);
                });

              var sideChart = e.append("g").attr("transform", "translate(-" + (5 + margin.left - offset) + ",0)");

              sideChart
                .append("rect")
                .attr("class", "coverage_rect")
                .attr("x", function (d) {
                  return d3.min([marginScale(d[layout]), margin.left - offset - 10]);
                })
                .attr("width", function (d) {
                  return d3.max([margin.left - offset - marginScale(d[layout]), 10]);
                })
                .attr("height", gridHeight - gridGap)
                .style("opacity", 0.7)
                .style("fill", "lightgrey")
                .on("mouseover", function (d) {
                  d3.select(this.parentNode.parentNode).selectAll(".rlabel").style("opacity", 0);
                  d3.select(this.parentNode).selectAll(".coverage_rect,.barLabel").style("opacity", 1);
                })
                .on("mouseout", function (d) {
                  d3.select(this.parentNode.parentNode).selectAll(".rlabel").style("opacity", 1);
                  d3.select(this.parentNode).select(".coverage_rect").style("opacity", 0.7);
                  d3.select(this.parentNode).select(".barLabel").style("opacity", 0);
                });

              sideChart
                .append("text")
                .attr("class", "barLabel")
                .attr("x", function (d) {
                  return d3.min([marginScale(d[layout]), margin.left - offset - 10]);
                })
                .text(valueFormat(d[layout]))
                .attr("text-anchor", "end")
                .attr("y", 15)
                .attr("font-size", 14)
                .style("stroke", "black")
                .style("opacity", 0)
                .attr("pointer-events", "none");

              e.append("text")
                .text(function (d) {
                  if (d.key.split("(")[0].length > 23) return d.key.split("(")[0].substring(0, 20) + "...";
                  else return d.key.split("(")[0];
                })
                .attr("class", "rlabel")
                .attr("text-anchor", "end")
                .attr("x", -5)
                .attr("y", 8)
                .attr("font-size", 11)
                .attr("pointer-events", "none")
                .attr("cursor", "default");

              d3.select("body").on("keydown", function () {
                if ([37, 38, 39, 40].indexOf(d3.event.keyCode) > -1) {
                  d3.event.preventDefault();
                  if (indexSelected === null) indexSelected = 0;
                  else {
                    if (d3.event.keyCode === 40) {
                      indexSelected = d3.min([indexSelected + 1, y.domain().length - 1]);
                      var indexRemoved = indexSelected - 1;
                    }
                    if (d3.event.keyCode === 38) {
                      indexSelected = d3.max([indexSelected - 1, 0]);
                      var indexRemoved = indexSelected + 1;
                    }
                  }
                  var entityRemoved = d3.selectAll(".entities").filter(function (d) {
                    return d.key === y.domain()[indexRemoved];
                  });
                  var entitySelected = d3.selectAll(".entities").filter(function (d) {
                    return d.key === y.domain()[indexSelected];
                  });
                  keyRemoveHighlight(entityRemoved);
                  keyHighlight(entitySelected);

                  var allNodes = entitySelected.selectAll(".available")[0];
                  var startYear = +allNodes[0].__data__.year;
                  var endYear = +allNodes[allNodes.length - 1].__data__.year;

                  if (yearSelected === null) yearSelected = startYear;
                  if (yearSelected !== null) {
                    if (d3.event.keyCode === 39) {
                      yearSelected = d3.min([yearSelected + 1, endYear]);
                      var dotSelected = entitySelected.selectAll(".available").filter(function (d) {
                        return +d.year >= yearSelected;
                      });
                      yearSelected = +dotSelected[0][0].__data__.year;
                    }
                    if (d3.event.keyCode === 37) {
                      yearSelected = d3.max([yearSelected - 1, startYear]);
                      var dotSelected = entitySelected.selectAll(".available").filter(function (d) {
                        return +d.year <= yearSelected;
                      });
                      yearSelected = +dotSelected[0][dotSelected[0].length - 1].__data__.year;
                    }
                  }
                  d3.selectAll(".available").selectAll("circle").style("stroke", "none").style("opacity", 0.7);
                  d3.select("#reporting-synth-container").selectAll(".highlight,#gradient").remove();
                  dotSelected = entitySelected.selectAll(".available").filter(function (d) {
                    return +d.year === yearSelected;
                  });

                  if (dotSelected.node() !== null) {
                    var wid = tooltip.style("width").replace("px", "");
                    dotSelected.select("circle").style("stroke", "black").style("opacity", 1);
                    var nodePos = dotSelected.node().getBoundingClientRect();
                    tooltipContext(tooltip, dotSelected.datum());
                    tooltip
                      .style("display", "block")
                      .style("left", nodePos.left - wid / 2 + "px")
                      .style("top", nodePos.top + window.scrollY + 40 + "px");
                    gradientHighlight(yearSelected);
                  } else tooltip.style("display", "none");
                }
              });
            }); //end draw entity group

            function keyHighlight(keySelected) {
              var dataSelected = keySelected.datum();
              keySelected.selectAll(".rlabel").style("stroke", "black").attr("y", 15).attr("font-size", "14px");
              keySelected.selectAll(".overlay").style("fill", "lightgrey");
              keySelected.selectAll(".overlay,.coverage_rect").attr("height", gridHeight - gridGap + 15);
              keySelected
                .selectAll(".available")
                .selectAll("circle")
                .attr("cy", (gridHeight - gridGap + 15) / 2);
              keySelected
                .selectAll(".available")
                .selectAll("rect")
                .attr("height", gridHeight - gridGap + 15);
              d3.selectAll(".entities")
                .filter(function (e) {
                  return y(e.key) > y(dataSelected.key);
                })
                .attr("transform", function (e) {
                  var curTransform = d3.select(this).attr("transform");
                  var curXPos = +curTransform.split(",")[0].replace("translate(", "");
                  var curYPos = +curTransform.split(",")[1].replace(")", "");
                  return "translate(" + curXPos + "," + (curYPos + 15) + ")";
                });
            }
            function keyRemoveHighlight(keySelected) {
              keySelected.selectAll(".rlabel").style("stroke", "none").attr("y", 8).attr("font-size", "11px");
              keySelected.selectAll(".overlay").style("fill", "none");
              keySelected.selectAll(".overlay,.coverage_rect").attr("height", gridHeight - gridGap);
              keySelected
                .selectAll(".available")
                .selectAll("circle")
                .attr("cy", function (v) {
                  return gridHeight / 2;
                });
              keySelected
                .selectAll(".available")
                .selectAll("rect")
                .attr("height", gridHeight - gridGap);
              d3.selectAll(".entities").attr("transform", function (d) {
                return "translate(0 ," + y(d.key) + ")";
              });
            }
            function tooltipContext(tooltip, v) {
              tooltip
                .select(".title")
                .html(
                  "<h5>" +
                    v.reporting +
                    "<br> (" +
                    v.type.split("/")[0] +
                    " in " +
                    v.continent +
                    ")<br>" +
                    " in " +
                    v.year +
                    "</h5>",
                );
              tooltip.selectAll(".source,.reference").html("");

              if (colorBy === "reference")
                tooltip
                  .select(".reference")
                  .html("<hr><p style='font-weight:bold'>World Partner: <br>" + v.reference + "</p>");
              if (colorBy === "sourcetype")
                tooltip
                  .select(".source")
                  .html(
                    "<hr><div><span style='font-weight:bold'>Source(" +
                      v.sourcetype +
                      ")</span>" +
                      ":<br>" +
                      v.source +
                      "</div>",
                  );

              if (colorBy === "partner_intersect")
                tooltip
                  .select(".reference")
                  .html(
                    "<hr><p style='font-weight:bold'>Number of Mirror Partners: " + v.partner_intersect.length + "</p>",
                  );
              tooltip.select(".tip_svg").style("display", "none");
              tooltip.select(".table").style("display", "none");

              if (colorBy === "partner") {
                tooltip.select(".tip_svg").style("display", "block");
                tooltip.select(".tip_svg").selectAll("*").remove();
                tooltip
                  .select(".tip_svg")
                  .html(
                    v.partner.length === 0
                      ? "<hr><strong>World Partner Only</strong>"
                      : "<hr><strong>Number of partners: " + v.partner.length + "</strong>",
                  );
                if (v.partnertype === "actual") {
                  tooltip.select(".tip_svg").append("p").text("By continent:");
                  tooltip
                    .select(".tip_svg")
                    .append("svg")
                    .attr("width", tip_width)
                    .attr("height", 20 * v.partner_continent.length + tip_margin.top + tip_margin.bottom + 20)
                    .append("g")
                    .attr("class", "tip_group")
                    .attr("transform", "translate(" + tip_margin.left + "," + tip_margin.top + ")");
                  x_tip.domain([
                    0,
                    d3.max(v.partner_continent, function (d) {
                      return d.number;
                    }),
                  ]);

                  var tip_partner = tooltip
                    .select(".tip_group")
                    .selectAll(".tip_partner")
                    .data(v.partner_continent)
                    .enter()
                    .append("g")
                    .attr("class", "tip_partner")
                    .attr("transform", function (d, i) {
                      return "translate(0," + 2 * i * (gridHeight + 2) + ")";
                    });
                  tip_partner
                    .append("rect")
                    .attr("width", function (d) {
                      return x_tip(d.number);
                    })
                    .attr("height", 10)
                    .attr("fill", function (d) {
                      return colorByContinent(d.continent);
                    });
                  tip_partner
                    .append("text")
                    .text(function (d) {
                      return d.continent;
                    })
                    .attr("class", "continentLabel")
                    .attr("y", -2)
                    .attr("fill", "#fff")
                    .attr("font-size", 11);
                  tip_partner
                    .append("text")
                    .text(function (d) {
                      return d.number;
                    })
                    .attr("x", function (d) {
                      return x_tip(d.number) + 2;
                    })
                    .attr("y", 9)
                    .attr("text-anchor", "start")
                    .attr("fill", "#fff")
                    .attr("font-size", 12);
                }
              }
              if (colorBy === "mirror_rate") {
                tooltip.select(".table").style("display", "block");
                tooltip.select(".table").select("table").remove();
                tooltip
                  .select(".table")
                  .html(
                    "<table><tr><td>Number of mirror partner</td><td style='text-align:right'>" +
                      v.partner_intersect.length +
                      "</td></tr><tr><td>Number of partner</td><td style='text-align:right'>" +
                      v.partner.length +
                      "</td></tr><tr><td>Mirror Rate</td><td style='text-align:right'>" +
                      d3.round(v.mirror_rate, 2) +
                      "</td></tr></table>",
                  );
              }
            }
            function gradientHighlight(year) {
              var svg_axis = d3.select("#reporting-synth-container").select(".synth_svg");
              var axis_height = 100;
              //tick highlighting
              var text = svg_axis
                .append("text")
                .attr("class", "highlight")
                .attr("x", x(new Date(year, 0, 1)))
                .attr("y", axis_height + 17)
                .attr("font-size", "0.85em")
                .attr("text-anchor", "middle")
                .text(year);

              // Define the gradient
              var gradient = svg_axis
                .append("svg:defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

              // Define the gradient colors
              gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", "#f5f5f5").attr("stop-opacity", 0.1);

              gradient.append("svg:stop").attr("offset", "50%").attr("stop-color", "#f5f5f5").attr("stop-opacity", 1);

              gradient
                .append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#f5f5f5")
                .attr("stop-opacity", 0.1);

              // add rect as background to hide date display in
              var bbox = text.node().getBBox();
              var rect = svg_axis
                .append("svg:rect")
                .attr("class", "highlight")
                .attr("x", bbox.x - 20)
                .attr("y", bbox.y)
                .attr("width", bbox.width + 40)
                .attr("height", bbox.height)
                .style("fill", "url(#gradient)");
              svg_axis
                .append("text")
                .attr("class", "highlight")
                .attr("x", x(new Date(year, 0, 1)))
                .attr("y", axis_height + 17)
                .attr("font-size", "0.85em")
                .attr("text-anchor", "middle")
                .text(year);
            }
          }
        },
      };
    },
  ]);
