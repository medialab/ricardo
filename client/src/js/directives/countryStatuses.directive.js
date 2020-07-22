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
angular.module("ricardo.directives.countryStatuses", []).directive("countryStatuses", [
  "$filter",
  function ($filter) {
    return {
      restrict: "E",
      template: '<div class="country-statuses-chart"></div>',
      replace: false,
      scope: {
        sovereigntyData: "=",
        dependenciesData: "=",
        boundaries: "=",
      },
      link: function (scope, element) {
        const CHART_HEIGHT = 100;
        const X_AXIS_HEIGHT = 20;

        element.on("$destroy", () => {
          flushDOM(element[0]);
        });

        scope.$watchCollection("[sovereigntyData, dependenciesData, boundaries]", (newValue, oldValue) => {
          const [sovereigntyData, dependenciesData, boundaries] = newValue;
          render(element[0], sovereigntyData, dependenciesData, boundaries);
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
        function render(domRoot, sovereigntyData, dependenciesData, boundaries) {
          flushDOM(domRoot);

          // Prepare data:
          let maxDepsPerYear = 0;
          const depsPerYear = d3.range(boundaries.minYear, boundaries.maxYear).reduce(
            (iter, year) => ({
              ...iter,
              [year]: {
                deps: [],
                depsCount: 0,
              },
            }),
            {},
          );
          dependenciesData.forEach((dep) => {
            d3.range(dep.startYear, dep.endYear).forEach((year) => {
              if (!depsPerYear[year]) return;

              depsPerYear[year].deps.push(dep);
              depsPerYear[year].depsCount++;
              maxDepsPerYear = Math.max(depsPerYear[year].depsCount, maxDepsPerYear);
            });
          });

          // Initialize stage and commons:
          const topPadding = 20;
          const leftPadding = 25;
          const width = domRoot.parentElement.offsetWidth;
          const chartWidth = width - leftPadding;
          const height = CHART_HEIGHT + X_AXIS_HEIGHT + topPadding;
          const svg = d3.select(domRoot).append("svg").attr("width", width).attr("height", height);
          const chart = svg.append("g").attr("transform", `translate(${leftPadding},${topPadding})`);

          const xScale = d3.scale.linear().range([0, chartWidth]).domain([boundaries.minYear, boundaries.maxYear]);
          const yScale = d3.scale.linear().range([0, CHART_HEIGHT]).domain([maxDepsPerYear, 0]);

          // Captions:
          svg
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(${leftPadding},${CHART_HEIGHT + topPadding})`)
            .call(
              d3.svg
                .axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(10)
                .outerTickSize(0)
                .tickFormat((d) => d.toString()),
            );
          svg
            .append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(0,${topPadding})`)
            .call(d3.svg.axis().scale(yScale).orient("right").ticks(3).tickSize(width))
            .call((g) => g.selectAll("text").attr("x", 4).attr("dy", -4).attr("font-size", "0.85em"));

          // Represent sovereignty
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(sovereigntyData)
            .enter()
            .append("rect")
            .style("fill", "rgba(0, 0, 0, 0.1)")
            .attr("data-start-year", ({ startYear }) => startYear)
            .attr("data-end-year", ({ endYear }) => endYear)
            .attr("x", ({ startYear }) => xScale(startYear))
            .attr("y", -topPadding)
            .attr("width", ({ startYear, endYear }) => xScale(endYear) - xScale(startYear))
            .attr("height", CHART_HEIGHT + topPadding);

          // Represent dependencies
          const rectGroups = chart
            .append("g")
            .attr("class", "dependencies-chart")
            .selectAll("g")
            .data(d3.range(boundaries.minYear, boundaries.maxYear))
            .enter()
            .append("g");
          rectGroups
            .append("title")
            .text(
              (year) =>
                `${$filter("translate")("IN_YEAR")} ${year}, ${depsPerYear[year].depsCount} ${
                  depsPerYear[year].depsCount > 1
                    ? $filter("translate")("DEPENDENCIES")
                    : $filter("translate")("DEPENDENCY")
                }`,
            );
          rectGroups
            .append("rect")
            .style("fill", "#cc6666")
            .attr("data-year", (year) => year)
            .attr("data-deps", (year) => depsPerYear[year].depsCount)
            .attr("x", (year) => xScale(year))
            .attr("y", (year) => yScale(depsPerYear[year].depsCount))
            .attr("width", (year) => xScale(year + 1) - xScale(year) - 2)
            .attr("height", (year) => yScale(maxDepsPerYear - depsPerYear[year].depsCount));
        }
      },
    };
  },
]);
