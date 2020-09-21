/**
 * DATA TYPES:
 * ***********
 *
 * > sovereigntyData:
 *   Basically an array of entries from the `statusInTime` dataset
 *   [
 *     {
 *       relation: relation label/id
 *       startYear: start of the relation
 *       endYear: end of the relation
 *     }
 *     ...
 *   ]
 *
 * > dependenciesData:
 *   Similarly an array of entries from the `statusInTime` dataset, but enriched
 *   with proper labels
 *   [
 *     {
 *       id: dependency ID
 *       label: dependency label
 *       relation: relation label/id
 *       startYear: start of the relation
 *       endYear: end of the relation
 *     }
 *     ...
 *   ]
 *
 * > boundaries:
 *   {
 *     minYear
 *     maxYear
 *   }
 */
angular.module("ricardo.directives.politicalStatuses", []).directive("politicalStatuses", [
  function () {
    return {
      restrict: "E",
      replace: false,
      scope: {
        data: "=",
        boundaries: "=",
      },
      link: function (scope, element) {
        const BAR_HEIGHT = 20;
        const X_AXIS_HEIGHT = 25;

        // Manage the lifecycle of the container
        const rootElement = element[0];
        const container = d3.select(rootElement).append("div").attr("id", "political-statuses-chart");
        element.on("$destroy", function () {
          d3.select("#political-statuses-chart").remove();
        });

        scope.$watchCollection("[data, boundaries]", (newValue, oldValue) => {
          const [data, boundaries] = newValue;
          if (data) render(data, boundaries);
        });

        /**
         * This function flushes the whole previously generated DOM, to build a
         * full new one.
         */
        function render(entityStatusesData, boundaries) {
          d3.select("#political-statuses-chart > svg").remove();
          // filter data with time boundaries:
          const nbDepsPeriods = entityStatusesData.nbDepsPeriods.filter(
            (p) => p.startYear <= boundaries.maxYear && p.endYear >= boundaries.minYear,
          );

          // Initialize stage and commons:
          const topPadding = 0;
          const leftPadding = 25;
          const width = rootElement.offsetWidth;
          const chartWidth = width;
          const height = BAR_HEIGHT + X_AXIS_HEIGHT;
          const svg = container.append("svg").attr("width", width).attr("height", height);
          const chart = svg.append("g").attr("transform", `translate(0,${topPadding})`);

          const xPageScale = d3.scale.linear().range([0, chartWidth]).domain([boundaries.minYear, boundaries.maxYear]);
          const chartMinX = xPageScale(Math.max(boundaries.minYear, 1816));

          const xScale = d3.scale
            .linear()
            .range([chartMinX, chartWidth])
            .domain([Math.max(boundaries.minYear, 1816), boundaries.maxYear]);
          const tooltip = container.append("div").attr("class", "politicalstatus-tooltip");
          // Captions:
          svg
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${BAR_HEIGHT})`)
            .call(
              d3.svg
                .axis()
                .scale(xScale)
                .orient("bottom")
                .tickValues(xScale.ticks().filter((t) => Number.isInteger(t)))
                .outerTickSize(0)
                .tickFormat(d3.format("d")),
            );

          // Represent non sovereignty
          // hatch pattern
          const pattern = svg
            .append("defs")
            .append("pattern")
            .attr("id", "diagonalHatch")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("patternTransform", "rotate(45 0 0)")
            .attr("width", 6)
            .attr("height", 6);
          pattern
            .append("line")
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 1)
            .attr("y2", 6)
            .attr("stroke", "#000")
            .attr("stroke-width", 1);
          pattern
            .append("line")
            .attr("x1", 2)
            .attr("y1", 0)
            .attr("x2", 2)
            .attr("y2", 6)
            .attr("stroke", "#EEE")
            .attr("stroke-width", 1);

          // Represent dependencies
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(nbDepsPeriods)
            .enter()
            .append("rect")
            .style("fill", (p) => `rgba(180, 0, 0, ${p.depsCount / entityStatusesData.maxDepsPerYear})`)
            .attr("data-start-year", ({ startYear }) => startYear)
            .attr("data-end-year", ({ endYear }) => endYear)
            .attr("x", ({ startYear }) => xScale(startYear + 0.05))
            .attr("y", 0)
            .attr("width", ({ startYear, endYear }) => xScale(endYear + 0.9) - xScale(startYear)) //, xScale(1817) - xScale(1816)))
            .attr("height", BAR_HEIGHT)
            .on("mouseover", function (e) {
              tooltip
                .html(`Sovereign<br>${e.depsCount} dependencies from ${e.startYear} to ${e.endYear}`)
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

          // color scale on sov status TO DO
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(entityStatusesData.sovereigntyData)
            .enter()
            .append("rect")
            .style("fill", ({ isSovereign }) => (isSovereign ? "rgba(0, 0, 0, 0)" : "url(#diagonalHatch)"))
            .attr("data-start-year", ({ startYear }) => startYear)
            .attr("data-end-year", ({ endYear }) => endYear)
            .attr("x", ({ startYear }) => xScale(startYear))
            .attr("y", 0)
            .attr("width", ({ startYear, endYear }) => xScale(endYear) - xScale(startYear))
            .attr("height", BAR_HEIGHT)
            .on("mouseover", function (e) {
              tooltip
                .html(
                  `${e.GPH_status === "Informal" ? "Informal" : "Non-sovereign"} from ${e.startYear} to ${e.endYear}`,
                )
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
      },
    };
  },
]);
