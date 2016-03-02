'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

      var yearsDelta = d3.range(1787, 1940)
      console.log(yearsDelta)

      function init() {
        apiService
          .getReportingsAvailableByYear()
          .then(function (reportings){

            // transform array of string in array of int
            reportings.forEach(function (r) {
              r.years = r.years.split(',')
                                 .map(function (e) {
                                return e = parseInt(e)
                              })
            })

            var margin = {top: 20, right: 200, bottom: 0, left: 20},
                width = document.querySelector('#matrix').offsetWidth,
                height = 10500,
                marginLeft = 0,
                marginTop = 15;

              var start_year = 1787,
                  end_year = 1940;

              var c = d3.scale.category20c();

              var x = d3.scale.linear()
                .range([0, width]);

              var xAxis = d3.svg.axis()
                .scale(x)
                .orient("top");

              var formatYears = d3.format("0000");
              xAxis.tickFormat(formatYears);

              var svg = d3.select("#matrix").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("margin-left", margin.left + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              x.domain([start_year, end_year]);

              var xScale = d3.scale.linear()
                .domain([start_year, end_year])
                .range([0, width]);

              var barWidth = Math.floor(width / 150);
              var barHeigth = 10;

              var axis = svg.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + 40 + ")")
                  .call(xAxis);

              var tooltip = d3.select("body")
                  .append("div")
                  .attr("class", "matrix-tooltip");

              reportings.forEach(function (r, i) {
                var y0 = marginTop + 40 + i * 30;

                var histo = svg.append("g")
                  .attr("class", "hist")
                  .attr("transform", function(d) { return "translate(" + marginLeft + "," + y0 + ")"; })
                  .attr("class", "svgElement")

                histo.selectAll(".bar")
                  .data(r.years)
                  .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d){ return x(d) })
                  .attr("width", barWidth)
                  .attr("height", barHeigth)
                  .attr("fill", "red")
                  .style("border-left", "solid 1px white");

                histo.append("text")
                  .attr("class", "legend")
                  .attr("x", 0)
                  .attr("y", -5)
                  .attr("font-size", "0.8em")
                  .text(function(d){ return r.reporting_id })

                histo.selectAll(".tooltipBar")
                  .data(r.years)
                  .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d){ return x(d)})
                  .attr("y", 0)
                  .attr("width", barWidth)
                  .attr("height", barHeigth)
                  .attr("opacity", 0)
                  .on('mouseover', function(d) {
                    return tooltip.html(
                      "<p>" + d + "</p>"
                      ).transition().style("opacity", .9);
                  })
                  //.on('mouseenter', this.onmouseover)
                  .on('mouseout', function(d) {
                    return tooltip.transition().style("opacity", 0);
                  })
                  .on('mousemove', function(d) {
                    tooltip.style("opacity", .9);
                    var wid = tooltip.style("width").replace("px", "");
                    return tooltip
                      .style("left", Math.min(window.innerWidth - wid - 20,
                        Math.max(0, (d3.event.pageX - wid/2))) + "px")
                      .style("top", (d3.event.pageY + 40) + "px")
                      .style("width", wid + "px");
                  });

              })
          })
      }

      init()
    }])