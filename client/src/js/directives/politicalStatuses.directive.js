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
  function ($filter) {
    return {
      restrict: "E",
      template: '<div class="political-statuses-chart"></div>',
      replace: false,
      scope: {
        gphData: "=",
        partner: "=",
        boundaries: "=",
      },
      link: function (scope, element) {
        const CHART_HEIGHT = 40;
        const X_AXIS_HEIGHT = 20;

        

        element.on("$destroy", () => {
          flushDOM(element[0]);
        });

        scope.$watchCollection("[gphData, partner, boundaries]", (newValue, oldValue) => {
          const [gphData, partner, boundaries] = newValue;
          const vizData = prepareData(gphData, partner, boundaries);
          render(element[0], vizData.sovereigntyData, vizData.nonSovereigntyData, vizData.dependenciesData, boundaries);
        });

        /**
         * This function takes the full GPH dataset and other relevant arguments
         * and generate proper indices for rendering.
         */
        function prepareData(gphData, partner, boundaries) {

          const { entities, statusInTime, status } = gphData;
          const { minYear, maxYear } = boundaries;
          const result = {
            sovereigntyData: [],
            nonSovereigntyData: [],
            dependenciesData: [],
          };
          

          if (!entities || !statusInTime || !status) return result;

          const SOVEREIGNTY_STATUSES = status
                                        .filter(s => s.group === "Sovereign (all)")
                                        .reduce( (acc,s) => {
                                          acc[s.GPH_status] = true
                                          return acc}, {});
          const DEPENDENCIES_STATUSES = status
                                        .filter(s => ["Non sovereign", "Part of"].includes(s.group))
                                        .reduce( (acc,s) => {
                                          acc[s.GPH_status] = true
                                          return acc}, {});

          // Search for entity in GeoPolHist corpus:
          const gphPartnerEntity = entities.find((entity) => partner === entity.GPH_name);

          // If no entity has been found, reset related data:
          if (!gphPartnerEntity) return result;

          const entitiesIndex = entities.reduce(
            (iter, entity) => ({
              ...iter,
              [entity.GPH_code]: entity,
            }),
            {},
          );
          statusInTime.forEach(({ GPH_code, sovereign_GPH_code, GPH_status, start_year, end_year }) => {
            // Check years boundaries:
            if (+start_year > +maxYear || end_year < minYear) return;

            const startYear = Math.max(start_year, minYear);
            const endYear = Math.min(end_year, maxYear);

            if (SOVEREIGNTY_STATUSES[GPH_status] && GPH_code === gphPartnerEntity.GPH_code) {
              result.sovereigntyData.push({
                relation: GPH_status,
                startYear: startYear,
                endYear: endYear,
              });
            }
            if (DEPENDENCIES_STATUSES[GPH_status] && GPH_code === gphPartnerEntity.GPH_code) {
              result.nonSovereigntyData.push({
                relation: GPH_status,
                label: entitiesIndex[GPH_code].GPH_name,
                startYear: startYear,
                endYear: endYear,
              });
            }
            if (DEPENDENCIES_STATUSES[GPH_status] && sovereign_GPH_code === gphPartnerEntity.GPH_code) {
              result.dependenciesData.push({
                id: GPH_code,
                label: entitiesIndex[GPH_code].GPH_name,
                relation: GPH_status,
                startYear: startYear,
                endYear: endYear,
              });
            }
          });

          return result;
        }

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
        function render(domRoot, sovereigntyData, nonSovereigntyData, dependenciesData, boundaries) {
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
          const axisXPosition = xScale(Math.max(boundaries.minYear, 1816));
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
          const yAxisTicks = yScale.ticks(2)
            .filter(tick => Number.isInteger(tick));
          
          svg
            .append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${axisXPosition},${topPadding})`)
            .call(d3.svg.axis().scale(yScale).orient("right").tickValues(yAxisTicks).tickSize(width).tickFormat(d3.format('d')))
            .call((g) => g.selectAll("text").attr("x",4).attr("dy", -4).attr("font-size", "0.85em"));

          // Represent non sovereignty
          chart
            .append("g")
            .attr("class", "sovereignty-chart")
            .selectAll("rect")
            .data(nonSovereigntyData)
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
