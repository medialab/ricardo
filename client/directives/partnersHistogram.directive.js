'use strict';

/* 
 * Partners Histogram directive displays a visualisation about each partner
 * of the reporting selected. Each partner has a circle with the % of total trade
 * and a line with bars which represent the commercial balance.
 */

angular.module('ricardo.directives.partnersHistogram', [])
  .directive('partnersHistogram', ['$timeout', function ($timeout){
    return {
      restrict: 'E',
      template: '<div id="partners-histogram-container"></div>',
      scope: {
        ngData: '=',
        startDate: '=',
        endDate: '=',
        indexYears: '=',
        countryData: '=',
        groupData: '=',
        orderData: '=',
        sortData: '=',
        filterData: '='
      },
      link: function(scope, element, attrs) {

        /*
         * Watch functions to update visualisation
         */
        var chart = d3.select(element[0]);

        scope.$watch("ngData", function (newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)          
            partnersHistogram(newValue, scope.orderData, scope.indexYears, scope.startDate, scope.endDate);
          }
        }, true);

        scope.$watch("startDate", function (newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)          
            partnersHistogram(scope.ngData, scope.orderData, scope.indexYears, newValue, scope.endDate);
          }
        }, true);

        scope.$watch("endDate", function (newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)          
            partnersHistogram(scope.ngData, scope.orderData, scope.indexYears, scope.startDate, newValue);
          }
        }, true);

        /*
         * Displaying functionx
         */

        function removeSvgElements(chart) {
          chart.selectAll("text.legend").remove();
          chart.selectAll("rect.bar").remove();
          chart.selectAll("circle").remove();
        }

        function noData () {
          d3.select("#partners-histogram-container").append("div")
            .attr("class", "alert")
            .attr("id", "missingDataHisto")
            .html(function() {
               return '<div class="modal-body" ><p> There is <strong>no data available</strong> in the database for this filter</p><p>Choose another one or change date selection, thank you !</p> </div> <div class="modal-footer"><button class="btn btn-default" ng-click="okPartner()">OK</button></div>';})
            .on("click", function(){
              chart.selectAll("div#missingDataHisto").remove();
            })
        } 

        /*
         * Partner Histo tools functions 
         */ 

        function cleanids(str){
          return str.replace(/\W/g, '');
        }
        function shorten(str){
          return (str.length < 24 ? str : str.slice(0, 22).replace(/\s+$/, '') + "…");
        }
        
        var format = d3.format("0,000");

        function formatAmount(line, field){
          var res = parseInt(line[field]);
          res = format(Math.round(res));
          return (res ? res : 0) + "&nbsp;" + currency.replace(/\s+/, '&nbsp;');
        }
        function formatPercent(val){
          var res = parseInt(val);     
          if (!res) res = Math.round(parseFloat(val * 10)) / 10;
           return (res ? res : "0.0") + "%";
        }

        function formatPercent2(val){
          var res = parseInt(val);     
          if (!res) res = Math.round(parseFloat(val * 10)) / 10;
           return (res ? res : "0.0");
        }

        function formatPercent3(val){
          var res = parseInt(val);     
          if (!res) res = Math.round(parseFloat(val * 10)) / 10;
           return (res ? res : "0.00");
        }

        function rollupYears(leaves){
          var res = {
            exp: d3.sum(leaves, function(d){
              if (!/^World/.test(d.partner_id) )
                return d.exp
              else
                return 0
            }),
            imp: d3.sum(leaves, function(d){
              if (!/^World/.test(d.partner_id) )
                return d.imp
              else
                return 0
            }),
          };
          res.tot = res.exp + res.imp;
          res.type = leaves
          return res;
        }

          var height = 600,
              width = document.querySelector('#partners-histogram-container').offsetWidth,
              marginTop = 15,
              marginLeft = 0,
              marginRight = 0,
              duration = 1000,
              barMinHeigth = 2,
              barMaxHeigth = 30,
              barGap = 40,
              barColors = ["#663333", "#cc6666"],
              currency = "sterling pound",
              sum = 0,
              RICentities = scope.countryData,
              chart;
        /*
         * Start pure work of visualisation
         */

        function partnersHistogram(data, order, indexYears, minDate, maxDate){

          var partners = data;
          height = (partners.length + 1) * (barMaxHeigth + barGap);
          var selection = d3.select("#partners-histogram-container");

          if (selection.select('svg').empty()){
            chart = selection.append('svg')
            .attr('width', width)
            .attr('height', height)
          } else {
            chart = selection.select('svg')
            .attr('width', width)
            .attr('height', height)
          }

          var x0, y0,
              years = Object.keys(indexYears),
              limits = d3.extent(years);
              years.pop(); // adjust year with timeline

          var x = d3.scale.linear()
              .domain([minDate, maxDate])
              .range([0, width]), 
              y = d3.scale.linear()
              .range([0, barMaxHeigth/2]);

          if (partners.length === 0)
            noData ();


          partners.forEach(function(p, i) {
            var entity = RICentities[""+p.key],
              name = (entity ? entity.RICname : p.key);

            y0 = marginTop + 40 + i * (barMaxHeigth + barGap);

            y.domain([0, d3.max(d3.extent(p.years, function(d) { return Math.abs(d.balance) }))])

            var histo = chart.append("g")
              .attr("class", "hist " + cleanids(p.key))
              .attr("transform", function(d) { return "translate(" + marginLeft + "," + y0 + ")"; })
              .attr("class", "svgElement")

            histo.append("line")
              .attr("x0", 0)
              .attr("x1", width)
              .attr("y0", 0)
              .attr("y1", 0)
              .attr("stroke", "#666")
              .attr("stroke-opacity", 0.1)
              .attr("shape-rendering", "crispEdges")
              .attr("stroke-width", 1)

            var endStart = (maxDate-minDate);
            var barWidth = Math.floor(width / endStart);

            histo.selectAll(".bar")
              .data(p.years)
              .enter().append("rect")
              .attr("class", "bar")
              .attr("x", function(d){ return x(d.key) })
              .attr("y", function(d){ return (d.balance >= 0 ? -y(Math.abs(d.balance)) : 0);})
              .attr("width", barWidth)
              .attr("height", function(d) { return (d.balance ? Math.max(barMinHeigth, y(Math.abs(d.balance))) : 0); })
              .attr("fill", function(d){ return barColors[+(d.balance >=0)] })
              .attr("opacity", function(d){ return (d.imp !== null && d.exp !== null ? 1 : 0.3) })
              .style("border-left", "solid 1px white");

            var tooltip = d3.select("body")
              .append("div")
              .attr("class", "partners-tooltip");

            histo.selectAll(".tooltipBar")
              .data(p.years)
              .enter().append("rect")
              .attr("class", "bar")
              .attr("x", function(d){ return x(d.key)})
              .attr("y", -barMaxHeigth/2 )
              .attr("width", barWidth)
              .attr("height", barMaxHeigth)
              .attr("opacity", 0)
              .on('mouseover', function(d) {
                return tooltip.html(
                  "<h3>"+ name + " in " + d.key + "</h3>" +
                  "<p>Balance : " + formatPercent(d.balance*100) + "</p>" +
                  "<p>Export: " + formatAmount(d, "exp") + "</p>" +
                  "<p>Import: " + formatAmount(d, "imp") + "</p>"
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

            histo.append("text")
              .attr("class", "legend")
              .attr("x", 60)
              .attr("y", -35)
              .attr("font-size", "0.8em")
              .text(function(d){ return name })

            if (order !== "name") {
              var rBigCircle = 12;
              histo.append("circle")
                .attr("cx", 25)
                .attr("cy", -40)
                .attr("r", rBigCircle)
                .style("stroke", "#777") 
                .style("fill", "transparent")   
 
              var rLittleCircle = formatPercent2(p["avg_" + order]) / 100 * rBigCircle;
              histo.append("circle")
                .attr("cx", 25)
                .attr("cy", -40)
                .attr("r", rLittleCircle)
                .style("stroke", "#333")  
                .style("fill", "#333")

              histo.append("text")
                .attr("class", "legend")
                .attr("x", 18)
                .attr("y", -17)
                .attr("font-size", "0.8em")
                .text(function(d){ return formatPercent(p["avg_" + order]) })  
            }
          });
        }
      } //end of link
    }
  }])