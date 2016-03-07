'use strict';

/* Directives */

angular.module('ricardo.directives.reportingsAvailable', [])

  /* directive with watch, update and draw functions */
  .directive('reportingsAvailable', [function(){
    return {
      restrict: 'E',
      template: '<div id="reportings-available-container"></div>',
      scope: {
        ngData: '=',
        ngSort: '='
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){

          if(newValue !== oldValue){

            	draw(newValue)

            }
        }, true);

        scope.$watch("ngSort", function (newValue, oldValue){

          if(newValue !== oldValue){
                if (newValue === "coverage") {
                	d3.selectAll(".hist").sort(function(a, b){

                		return d3.descending(a.years.length, b.years.length)

                	}).attr("transform", function(d, i) {
    					var y0 = 3*lineheigth + i * lineheigth;
    					return "translate(" + marginLeft + "," + y0 + ")";
    				})
                }
                else {
                    d3.selectAll(".hist").sort(function(a, b){

                        return d3.ascending(a.reporting_id, b.reporting_id)

                    }).attr("transform", function(d, i) {
                        var y0 = 3*lineheigth + i * lineheigth;
                        return "translate(" + marginLeft + "," + y0 + ")";
                    })
                }
            }
        }, true);

        var continentColors = {
                    "Europe":"#F4463C",
                     "Asia":"#44CC51" ,
                     "Africa":"#9980FC",
                     "America":"#30361C",
                     "World":"#976909",
                     "Oceania":"#C3BF4E"
                    }

        function colorByContinent(continent) {
          return continentColors[continent]
        }

        function shorten(str){
          return (str.length < 40 ? str : str.slice(0, 39).replace(/\s+$/, '') + "…");
        }

        var margin = {top: 20, right: 200, bottom: 0, left: 20},
	            width = document.querySelector('#reportings-available-container').offsetWidth,
	            vizWidth = 800,
	            lineheigth = 15,
	            marginLeft = 300,
	            marginRight = 0,
	            marginTop = 15;

        function draw(data) {

    			var height = data.length * lineheigth;
    			var start_year = 1787,
    			    end_year = 1940;

    			var c = d3.scale.category20c();

    			var x = d3.scale.linear()
    				.range([0, vizWidth]);

    			var xAxis = d3.svg.axis()
    				.scale(x)
    				.orient("top");

    			var formatYears = d3.format("0000");
    			xAxis.tickFormat(formatYears);

    			var svg = d3.select("#reportings-available-container").append("svg")
    				.attr("width", width)
    				.attr("height", height)

    			x.domain([start_year, end_year]);

    			var xScale = d3.scale.linear()
    				.domain([start_year, end_year])
    				.range([0, vizWidth]);

    			var barWidth = Math.floor(vizWidth/ (end_year - start_year));
    			var barHeigth = 14;

    			var axis = svg.append("g")
    			  .attr("class", "x axis")
    			  .attr("transform", "translate(300," + 40 + ")")
    			  .call(xAxis);

    			var tooltip = d3.select("body")
    			  .append("div")
    			  .attr("class", "matrix-tooltip");


    			var histo = svg.selectAll(".hist")
    				.data(data).enter()
    				.append("g")
    				.attr("class", "hist")
    				.attr("transform", function(d, i) {
    					var y0 = 3*lineheigth + i * lineheigth;
    					return "translate(" + marginLeft + "," + y0 + ")";
    				})

    			histo.selectAll(".bar")
    				.data(function(d) {return d.years})
    				.enter().append("rect")
    				.attr("class", "bar")
    				.attr("x", function(d){ return x(d)})
    				.attr("width", barWidth)
    				.attr("height", barHeigth)
    				.attr("fill", function (d) { return colorByContinent(d3.select(this.parentNode).datum().continent)})
    				//.style("shape-rendering", "crispEdges")
    				.style("border-left", "solid 1px white")
    				.on('mouseover', function(d) {
    				  return tooltip.html(
    				    "<p>" + d + "</p>"
    				    ).transition().style("opacity", .9);
    				})
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

    			histo.append("text")
    				.attr("class", "legend")
    				.attr("x", -300)
    				.attr("y", 10)
    				.attr("text-anchor", "start")
    				.attr("font-size", "11px")
    				.text(function (d){ return shorten(d.reporting_id) })
    				.attr("fill", function (d) { return colorByContinent(d.continent)})

        }
      }
    }
  }])