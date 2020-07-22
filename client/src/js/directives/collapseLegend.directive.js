/* Directives */
angular
  .module("ricardo.directives.collapseLegend", [])

  /* directive with only watch */
  .directive("collapseLegend", [
    function () {
      return {
        restrict: "E",
        templateUrl: "partials/collapseLegend.html",
        scope: {
          legend: "=",
          ngData: "=",
          filter: "=",
        },
        link: function (scope, element, attrs) {
          var margin = { top: 20, right: 20, bottom: 30, left: 10 },
            width = 250 - margin.left - margin.right,
            barHeight = 20,
            barWidth = 50;

          var i = 0,
            duration = 400,
            root;

          var tree = d3.layout.tree().nodeSize([0, 20]);

          var diagonal = d3.svg.diagonal().projection(function (d) {
            return [d.y, d.x];
          });

          var svg = d3
            .select("#color_legend")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var colorBy;
          scope.$watch("legend", function (newValue, oldValue) {
            if (newValue && newValue != oldValue && scope.ngData) drawLegend(scope.ngData);
          });

          scope.$watch("ngData", function (newValue, oldValue) {
            if (newValue && newValue != oldValue) drawLegend(newValue);
          });

          function drawLegend(data) {
            svg.selectAll("*").remove();
            var itemRadius = 8;
            var padding = 10;

            colorBy = scope.legend.name.value;
            var nodes_data = data.graph.nodes();
            var legend_data = nodes_data.map(function (d) {
              return d.attributes[colorBy];
            });
            legend_data = d3.set(legend_data).values();
            var flare = getFlare(legend_data, nodes_data);

            flare.x0 = 0;
            flare.y0 = 0;
            flare.children.forEach(function (d) {
              moveChildren(d);
            });
            update((root = flare));
          }

          function getFlare(category, nodes) {
            var flare = {};
            flare.label = "Color by " + colorBy;
            flare.color = "#636363";
            flare.children = [];
            category.forEach(function (d) {
              flare.children.push({
                label: d,
                color: scope.legend.color_domain(d),
                children: nodes.filter(function (node) {
                  return node.attributes[colorBy].toString() === d;
                }),
              });
            });
            return flare;
          }

          function update(source) {
            // Compute the flattened node list. TODO use d3.layout.hierarchy.
            var nodes = tree.nodes(root);

            var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);

            d3.select("svg").transition().duration(duration).attr("height", height);

            d3.select(self.frameElement)
              .transition()
              .duration(duration)
              .style("height", height + "px");

            // Compute the "layout".
            nodes.forEach(function (n, i) {
              n.x = i * barHeight;
            });

            // Update the nodes…
            var node = svg.selectAll("g.node").data(nodes, function (d) {
              return d.id || (d.id = ++i);
            });

            var nodeEnter = node
              .enter()
              .append("g")
              .attr("class", "node")
              .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
              })
              .style("opacity", 1e-6)
              .on("click", click);

            // Enter any new nodes at the parent's previous position.
            nodeEnter
              .append("circle")
              .attr("r", 6)
              .style("fill", function (d) {
                return d.color;
              })
              .style("stroke", function (d) {
                return d.color;
              });

            nodeEnter
              .append("text")
              .attr("class", "legend_text")
              .attr("dy", 4)
              .attr("dx", 8)
              .text(function (d) {
                return d.label;
              })
              .style("font-size", "12px");

            // Transition nodes to their new position.
            nodeEnter
              .transition()
              .duration(duration)
              .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
              })
              .style("opacity", 1);

            node
              .transition()
              .duration(duration)
              .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
              })
              .style("opacity", 1);

            // Transition exiting nodes to the parent's new position.
            node
              .exit()
              .transition()
              .duration(duration)
              .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
              })
              .style("opacity", 1e-6)
              .remove();

            // Update the links…
            var link = svg.selectAll("path.link").data(tree.links(nodes), function (d) {
              return d.target.id;
            });

            // Enter any new links at the parent's previous position.
            link
              .enter()
              .insert("path", "g")
              .attr("class", "link")
              .attr("d", function (d) {
                var o = { x: source.x0, y: source.y0 };
                return elbow({ source: o, target: o });
              })
              .style("opacity", 1e-6)
              .transition()
              .duration(duration)
              .attr("d", elbow);

            // Transition links to their new position.
            link.transition().duration(duration).attr("d", elbow);

            // Transition exiting nodes to the parent's new position.
            link
              .exit()
              .transition()
              .duration(duration)
              .attr("d", function (d) {
                var o = { x: source.x, y: source.y };
                return elbow({ source: o, target: o });
              })
              .remove();

            // Stash the old positions for transition.
            nodes.forEach(function (d) {
              d.x0 = d.x;
              d.y0 = d.y;
            });
          }

          function collapse(d) {
            if (d.children) {
              d._children = d.children;
              d._children.forEach(collapse);
              d.children = null;
            }
          }
          // Toggle children on click.
          function click(d) {
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
            if (d.parent) {
              d.parent.children.forEach(function (element) {
                if (d !== element) {
                  collapse(element);
                }
              });
            }
            update(d);
            if (d.depth === 1) {
              if (d.children) filterNode(d);
              if (d._children) {
                scope.filter.undo("neighbors", "legend").apply();
                scope.$apply();
              }
            }
          }

          function color(d) {
            return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
          }
          function filterNode(legend) {
            scope.filter
              .undo("neighbors", "legend")
              .nodesBy(function (n) {
                return n.attributes[colorBy].toString() === legend.label;
              }, "legend")
              .apply();
            scope.$apply();
          }
          function highlightNode(legend) {
            if (legend.depth === 1) {
              var filterNode = scope.ngData.graph.nodes().filter(function (d) {
                return d.attributes[colorBy].toString() !== legend.label;
              });
              filterNode.forEach(function (d) {
                d.color = "#eee";
              });
            }
            if (legend.depth === 2) {
              var filterNode = scope.ngData.graph.nodes().filter(function (d) {
                return d.label !== legend.label;
              });
              filterNode.forEach(function (d) {
                d.color = "#eee";
              });
            }
            scope.$apply();
          }
          function highlightNull(legend) {
            scope.ngData.graph.nodes().forEach(function (d) {
              d.color = scope.legend.color_domain(d.attributes[colorBy].toString());
            });
            scope.$apply();
          }

          function elbow(d, i) {
            return "M" + d.source.y + "," + d.source.x + "V" + d.target.x + "H" + d.target.y;
          }
          function moveChildren(node) {
            if (node.children) {
              node.children.forEach(function (c) {
                moveChildren(c);
              });
              node._children = node.children;
              node.children = null;
            }
          }
        },
      };
    },
  ]);
