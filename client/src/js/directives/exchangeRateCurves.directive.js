angular.module("ricardo.directives.exchangeRateCurves", []).directive("exchangeRateCurves", [
  function () {
    return {
      restrict: "E",
      templateUrl: "partials/exchangeRateCurves.html",
      replace: false,
      scope: {
        // This datum is only used because its change
        refCurrency: "=",
        currenciesList: "=",
        data: "=",
        dict: "=",
        boundaries: "=",
      },
      link: function (scope, element) {
        const STROKE_WIDTH = 1;
        const POINT_RADIUS = 8;
        const CURVE_HEIGHT = 50;
        const COLOR = "red";
        const formatRate = (v) => d3.round(v, 2);

        let hasBeenFirstRendered = false;
        let tooltip;

        element.on("$destroy", () => {
          flushDOM(element[0]);
          destroyTooltip();
        });

        scope.$watchCollection("[refCurrency, currenciesList, data, dict, boundaries]", (newValue, oldValue) => {
          if (!hasBeenFirstRendered) createTooltip();

          // When the referential is updated, regenerate every curves:
          if (!hasBeenFirstRendered || oldValue[0] !== newValue[0]) {
            flushDOM(element[0]);
            generateDOM(element[0], newValue[0], ...newValue.slice(2));
            updateDOM(element[0], newValue[1]);
          }
          // Else, only update the ones that are visible, and their order:
          else {
            updateDOM(element[0], ...newValue.slice(1));
          }

          hasBeenFirstRendered = true;
        });

        /**
         * This function flushed the whole DOM for this component.
         */
        function flushDOM(domRoot) {
          const curvesContainer = domRoot.querySelector(".curves-container");
          curvesContainer.innerHTML = "";
        }

        /**
         * This function flushes the whole previously generated DOM, to build a
         * full new one. It is expensive and should only be used when the whole
         * displayed data have been changed.
         */
        function generateDOM(domRoot, refCurrency, data, dict, boundaries) {
          const curvesContainer = domRoot.querySelector(".curves-container");
          const domWidth = domRoot.offsetWidth;

          // Initialize commons (d3 scales, ...):
          const padding = Math.max(Math.ceil(STROKE_WIDTH / 2), POINT_RADIUS);
          const x = d3.scale
            .linear()
            .range([padding, domWidth - padding])
            .domain([boundaries.minYear, boundaries.maxYear]);
          const y = d3.scale.linear().range([padding, CURVE_HEIGHT - padding]); // domain must be set for each curve

          // Draw actual curves
          for (const currency in data.rates) {
            const curve = getCurve(currency, refCurrency, data.rates[currency], dict, {
              x,
              y,
              width: domWidth,
              height: CURVE_HEIGHT,
            });
            curvesContainer.appendChild(curve);
          }
        }

        /**
         * Searches the DOM for curve elements, sorts them directly in the DOM
         * and sets visibility relatively to wether or not the curves'
         * currencies are in the given list:
         */
        function updateDOM(domRoot, currenciesList) {
          const placeholder = domRoot.querySelector(".no-currency-placeholder");
          const curvesContainer = domRoot.querySelector(".curves-container");

          if (!currenciesList || !currenciesList.length) {
            placeholder.classList.add("active");
            return;
          }

          placeholder.classList.remove("active");

          // Curves visibility:
          const visibleCurrencies = currenciesList.reduce((iter, curr) => ({ ...iter, [curr]: true }), {});
          const childrenIndex = {};
          [...curvesContainer.children].forEach((child) => {
            const currency = child.getAttribute("data-currency");
            childrenIndex[currency] = child;
            if (visibleCurrencies[currency]) {
              child.classList.remove("hidden");
            } else {
              child.classList.add("hidden");
            }
          });

          // Curves order:
          currenciesList.forEach((currency) => {
            curvesContainer.append(childrenIndex[currency]);
          });
        }

        /**
         * Returns a DOM element that displays the curve of the evolution of the
         * exchange rate for a given currency:
         */
        function getCurve(currency, refCurrency, rates, dict, { x, y, width, height }) {
          const elRoot = document.createElement("li");
          elRoot.setAttribute("data-currency", currency);
          elRoot.innerHTML = `
            <span class="curve-label">${dict[currency]}</span>
          `;
          const curveWrapper = document.createElement("div");
          curveWrapper.classList.add("curve");
          elRoot.appendChild(curveWrapper);

          // Shape data:
          const points = [];
          let minValue = Infinity;
          let maxValue = -Infinity;
          for (let year in rates) {
            minValue = Math.min(minValue, rates[year]);
            maxValue = Math.max(maxValue, rates[year]);
            points.push([+year, rates[year]]);
          }
          y.domain([minValue, maxValue]);

          // Initialize SVG:
          const svg = d3
            .select(curveWrapper)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`);
          const path = svg
            .append("path")
            .attr("fill", "transparent")
            .attr("stroke", COLOR)
            .attr("stroke-width", STROKE_WIDTH);
          const pointsGroup = d3
            .select(curveWrapper)
            .append("div")
            .attr("class", "points-group");

          // Draw curve:
          path.attr(
            "d",
            d3.svg
              .line()
              .x((d) => x(d[0]))
              .y((d) => y(d[1]))(points),
          );

          // Draw points:
          pointsGroup
            .selectAll("div")
            .data(points)
            .enter()
            .append("div")
            .attr("class", "point")
            .style("top", (d) => y(d[1]) + "px")
            .style("left", (d) => x(d[0]) + "px")
            .attr("r", POINT_RADIUS)
            // Tooltips management:
            .on("mouseover", (d) => {
              const { width, height } = tooltip.node().getBoundingClientRect();
              return tooltip
                .html(
                  `<p>In ${d[0]} :</p>
                   <p>1 ${dict[refCurrency]} = ${formatRate(d[1])} ${dict[currency]}</p>`,
                )
                .style("left", d3.event.pageX - width / 2 + "px")
                .style("top", d3.event.pageY - height - 5 + "px")
                .style("opacity", 0.9);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

          return elRoot;
        }

        /**
         * Helpers to create and destroy the tooltip in the document body:
         */
        function createTooltip() {
          if (tooltip) destroyTooltip();
          tooltip = d3.select("body").append("div").attr("class", "rates-tooltip");
        }
        function destroyTooltip() {
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        }
      },
    };
  },
]);
