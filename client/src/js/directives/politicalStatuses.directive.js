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
  "$filter",
  function () {
    return {
      restrict: "E",
      template: '<div class="political-statuses-chart"></div>',
      replace: false,
      scope: {
        data: "=",
        boundaries: "=",
      },
      link: function (scope, element) {
        const CHART_HEIGHT = 40;
        const X_AXIS_HEIGHT = 20;

        // events
        element.on("$destroy", () => {
          flushDOM(element[0]);
        });

        scope.$watchCollection("[data, boundaries]", (newValue, oldValue) => {
          const [data, boundaries] = newValue;
          if (data)
            render(element[0], data, boundaries);
        });

        /**
         * This function flushed the whole DOM for this component.
         */
        function flushDOM(domRoot) {
          domRoot.innerHTML = "";
        }

        /**
         * This function flushes the whole previously generated DOM, to build a
         * full new one.
         */
        function render(domRoot, entityStatusesData, boundaries) {
          flushDOM(domRoot);
          // filter data with time boundaries:
          const nbDepsPeriods = entityStatusesData.nbDepsPeriods.filter(p => p.startYear <= boundaries.maxYear && p.endYear >= boundaries.minYear)


          // Initialize stage and commons:
          const topPadding = 20;
          const leftPadding = 25;
          const width = domRoot.parentElement.offsetWidth;
          const chartWidth = width;
          const height = CHART_HEIGHT + X_AXIS_HEIGHT + topPadding;
          const svg = d3.select(domRoot).append("svg").attr("width", width).attr("height", height);
          const chart = svg.append("g").attr("transform", `translate(0,${topPadding})`);

          const xPageScale = d3.scale.linear().range([0, chartWidth]).domain([boundaries.minYear, boundaries.maxYear]);
          const chartMinX = xPageScale(Math.max(boundaries.minYear, 1816))

          const xScale = d3.scale.linear().range([chartMinX,chartWidth]).domain([Math.max(boundaries.minYear, 1816), boundaries.maxYear])
          const yScale = d3.scale.linear().range([0, CHART_HEIGHT]).domain([entityStatusesData.maxDepsPerYear, 0]);

          // Captions:
          svg
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${CHART_HEIGHT + topPadding})`)
            .call(
              d3.svg
                .axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(Math.max(boundaries.maxYear,1816) - boundaries.minYear < 5 ? 1 : 10)
                .outerTickSize(0)
                .tickFormat((d) => d.toString()),
            );

          // Represent non sovereignty
          // color scale on sov status TO DO
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(entityStatusesData.nonSovereigntyData.concat(entityStatusesData.sovereigntyData))
            .enter()
            .append("rect")
            .style("fill", "rgba(0, 0, 0, 0.1)")
            .attr("data-start-year", ({ startYear }) => startYear)
            .attr("data-end-year", ({ endYear }) => endYear)
            .attr("x", ({ startYear }) => xScale(startYear))
            .attr("y", -topPadding)
            .attr("width", ({ startYear, endYear }) => xScale(endYear) - xScale(startYear))
            .attr("height", CHART_HEIGHT /2 );

          // Represent dependencies
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(nbDepsPeriods)
            .enter()
            .append("rect")
            .style("fill", p => `rgba(180, 0, 0, ${p.depsCount/entityStatusesData.maxDepsPerYear})`)
            .attr("data-start-year", ({ startYear }) => startYear)
            .attr("data-end-year", ({ endYear }) => endYear)
            .attr("x", ({ startYear }) => xScale(startYear+0.05))
            .attr("y", CHART_HEIGHT/2 -topPadding )
            .attr("width", ({ startYear, endYear }) => xScale(endYear+0.9) - xScale(startYear) ) //, xScale(1817) - xScale(1816)))
            .attr("height", CHART_HEIGHT/2 );
         
        }
      },
    };
  },
]);
