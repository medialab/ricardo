/* Directives */
angular
  .module("ricardo.directives.heatmap", [])

  /* directive with watch, update and draw functions */
  .directive("heatmap", [
    function () {
      return {
        restrict: "E",
        scope: {
          data: "=", // { [year:number]: number} }
          startDate: "=", // number
          endDate: "=", // number
          // {string} The color for the heatmap
          color: "=",
          // {top|bottom|null} Should we display the X axis ?
          legend: "=",
          // {boolean} Should we compute opacity for the heatmap ?
          opacity: "=",
          // {(data, minValue, maxValue):string} function that takes the data and generate the texte for the tooltip
          tooltipFunction: "=",
        },
        link: function (scope, element, attrs) {
          /**
           * Variables
           */
          const defaultStartDate = 1786;
          const defaultEndDate = 1786;
          const defaultColor = "#000000";
          const defaultLegend = null;
          const defaultOpacity = true;
          const defaultTooltip = (data, min, max) => `${data.year} - ${Math.round(data.value)}`;
          const minOpacity = 0.2;
          const rootElement = element[0];
          const width = element[0].offsetWidth;
          const height = 0;
          const heightForLegend = 25;
          var svg, chart, chartData, tooltip;

          /**
           * Init D3
           */
          tooltip = d3.select(rootElement).append("div").attr("class", "heatmap-tooltip");
          svg = d3.select(rootElement).append("svg").attr("width", width).attr("height", height);
          chart = svg.append("g").attr("transform", `translate(0, 0)`);

          /**
           * Init Axis scaling
           */
          // Axis X
          var xScaling = d3.scale.linear().range([0, width]);
          var xAxis = d3.svg
            .axis()
            .scale(xScaling)
            .orient("bottom")
            .tickFormat((d) => d.toString());
          // Axis Y
          var yScaling = d3.scale.linear().range([height, 0]).domain([0, 1]);

          // Init chart (for data)
          chartData = chart.append("g").attr("class", "data");

          /**
           * (re)Generate the chart from the data.
           */
          function update(_data, _startDate, _endDate, _color, _legend, _opacity, _tooltip) {
            const startDate = _startDate || defaultStartDate;
            const endDate = _endDate || defaultEndDate;
            const color = _color || defaultColor;
            const legend = _legend || defaultLegend;
            const opacity = _opacity !== null && _opacity !== undefined ? _opacity : defaultOpacity;
            const tooltipText = _tooltip || defaultTooltip;
            // Compute the barsize
            const barSize = Math.floor(width / (endDate - startDate));

            // Legend & Axis
            //-----------
            // Complete X & Y axis
            xScaling.domain([startDate, endDate]);
            //remove everything
            svg.attr("height", barSize).select(".x.axis").remove();
            if (legend !== null) {
              xAxis.orient(legend);
              // update the height of the SVG + create the axis group
              svg
                .attr("height", barSize + heightForLegend)
                .append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0, ${legend === "bottom" ? barSize : heightForLegend})`)
                .call(xAxis);
              // position chart
              chart.attr("transform", `translate(0, ${legend === "top" ? heightForLegend : 0})`);
            }

            if (_data) {
              const data = Object.keys(_data).map((year) => {
                return { year: +year, value: _data[year] };
              });
              // Compute Min & Max value
              const minValue = d3.min(data.map((e) => e.value));
              const maxValue = d3.max(data.map((e) => e.value));

              // Update data of the SVG
              chartData
                .selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("width", barSize)
                .attr("x", function (row) {
                  return xScaling(row.year);
                })
                .attr("y", function (row) {
                  return 1;
                })
                .attr("height", function (row) {
                  return barSize;
                })
                .style({ fill: color })
                .style("opacity", function (row) {
                  let result = 1;
                  if (opacity && maxValue - minValue > 0) {
                    const pourcent = Math.round(((row.value - minValue) / (maxValue - minValue)) * 100) / 100;
                    result = minOpacity + pourcent * 0.7;
                  }
                  return result;
                })
                .on("mouseover", function (e) {
                  tooltip
                    .html(tooltipText(e, minValue, maxValue))
                    .transition()
                    .duration(200)
                    .style("visibility", "visible");
                })
                .on("mouseout", function (e) {
                  tooltip.transition().duration(200).style("visibility", "hidden");
                })
                .on("mousemove", function (e) {
                  tooltip.style("left", d3.event.x + 10 + "px").style("top", d3.event.y + 10 + "px");
                });
            }
          }

          /**
           * Watchers
           */
          scope.$watchCollection("[startDate, endDate, color, legend, opacity, tooltipFunction]", function (
            newValue,
            oldValue,
          ) {
            update(scope.data, newValue[0], newValue[1], newValue[2], newValue[3], newValue[4], newValue[5]);
          });
          scope.$watch(
            "data",
            function (newValue, oldValue) {
              update(
                newValue,
                scope.startDate,
                scope.endDate,
                scope.color,
                scope.legend,
                scope.opacity,
                scope.tooltipFunction,
              );
            },
            true,
          );
        },
      };
    },
  ]);
