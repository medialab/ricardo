'use strict';

/* Directives */

angular.module('ricardo.directives.partnersHistogram', [])

  /* directive with only watch */
  .directive('partnersHistogram', ['$timeout', function ($timeout){
    return {
      restrict: 'E',
      template: '<div id="partners-histogram-container"></div>',
      scope: {
        ngData: '=',
        startDate: '=',
        endDate: '=',
        countryData: '=',
        groupData: '=',
        orderData: '=',
        sortData: '=',
        filterData: '='
      },
      link: function(scope, element, attrs) {

        // var transmit by scope affectation
        var RICentities = scope.countryData;

        scope.$watch("ngData", function (newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)            
            partnersHistogram(newValue, scope.groupData, scope.orderData, scope.filterData, scope.sortData, scope.startDate, scope.endDate);
          }
        }, true);

        scope.$watch("groupData", function (newValue, oldValue){
          if (newValue !== oldValue) {
            removeSvgElements(chart);
            partnersHistogram(scope.ngData, newValue, scope.orderData, scope.filterData, scope.sortData, scope.startDate, scope.endDate);
          }
        }, true);

        scope.$watch("orderData", function (newValue, oldValue){
            if (newValue !== oldValue) {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, scope.groupData, newValue, scope.filterData, scope.sortData, scope.startDate, scope.endDate);
            }
        }, true);

        // uncomments these lines to use filter selection with calcul on all data
        scope.$watch("filterData", function (newValue, oldValue){
          if(newValue !== oldValue){
              removeSvgElements(chart) 
              partnersHistogram(scope.ngData, scope.groupData, scope.orderData, newValue, scope.sortData, scope.startDate, scope.endDate);
          }
        }, true)

        scope.$watch("sortData", function (newValue, oldValue){
            if (newValue !== oldValue) {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, scope.groupData, scope.orderData, scope.filterData, newValue, scope.startDate, scope.endDate);
            }
        }, true);

        scope.$watch("startDate", function (newValue, oldValue){
            if (newValue !== oldValue) {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, scope.groupData, scope.orderData, scope.filterData, scope.sortData, newValue, scope.endDate);
            }
        }, true);

        scope.$watch("endDate", function (newValue, oldValue){
            if (newValue !== oldValue) {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, scope.groupData, scope.orderData, scope.filterData, scope.sortData, scope.startDate, newValue);
            }
        }, true);


        

         // Partner Histo var initialization
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
            sum = 0;

       function removeSvgElements(chart) {
          chart.selectAll("text.legend").remove();
          chart.selectAll("rect.bar").remove();
          chart.selectAll("circle").remove();
       }

        var chart = d3.select(element[0])

        var refresh = function(newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)
            partnersHistogram(scope.ngData, continents, order, filtered, sorted, scope.startDate, scope.endDate);
          }
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

        // Partner Histo tools functions 

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

        var tooltip = d3.select("body")
          .append("div")
          .attr("class", "partners-tooltip");

        var tooltipCircle = d3.select("body")
          .append("div")
          .attr("class", "circle-tooltip");

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

        function partnersHistogram(data, continents, order, filtered, sort, minDate, maxDate){

          var indexYears = {};
          d3.nest()
            .key(function(d){ return d.year })
            .rollup(rollupYears)
            .entries(data)
            .forEach(function(y){
              indexYears[y.key] = y.values;
            })

          // We get rid of World partners
          data=data.filter(function(p){ return !/^World/.test(p.partner_id)})
          
          var partners = d3.nest()  
            .key(function(d){ return d[continents ? "continent" : "partner_id"] })
            .key(function(d){ return d.year })
            .rollup(rollupYears)
            .entries(data)

          function addTypePartner (partners) {
            var entityChecked = []; 
            partners.forEach(function (d) {
              if (entityChecked.indexOf(d.key) === -1 ) {
                for (var i = 0, len = data.length; i < len; i++) {
                  if (d.key === data[i].partner_id) {
                    d.type = data[i].type
                    entityChecked.push(d.key);
                  }
                }  
              }
            })
            return partners;
          }

          partners = addTypePartner(partners);

          partners.forEach(function(p){
            p.years = []
            p.values.forEach(function(d){
              p.years.push({
                key: d.key,
                exp: d.values.exp,
                imp: d.values.imp,
                balance: (d.values.exp - d.values.imp) / (d.values.exp + d.values.imp) || 0,
                pct_exp: d.values.exp / indexYears[d.key].exp * 100,
                pct_imp: d.values.imp / indexYears[d.key].imp * 100,
                pct_tot: (d.values.exp + d.values.imp) / indexYears[d.key].tot * 100
              });
            });

            delete p.values;
            p.avg_tot = d3.mean(p.years, function(d){ return d.pct_tot });
            p.avg_imp = d3.mean(p.years, function(d){ return d.pct_imp });
            p.avg_exp = d3.mean(p.years, function(d){ return d.pct_exp });
          })


          //filter data with filters selection
          if (filtered !== "all")
            partners = partners.filter(function (d) { return d.type === filtered})

          partners = partners.sort(function(a,b){
            if (sort === 'name') 
              return d3.ascending(a.key, b.key);
            else {
              return d3.descending(a["avg_" + order], b["avg_" + order]);
            }
          });

          height = (partners.length + 1) * (barMaxHeigth + barGap);

          var selection = d3.select("#partners-histogram-container");
          var chart;
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
                .range([0, width]), // witdh replace max width 
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
                  .on('mouseover', function(d) {
                  return tooltipCircle.html(
                    "<p>Total : " + formatPercent(p["avg_" + order]) + "</p>"
                    ).transition().style("opacity", .9);
                  })
                  //.on('mouseenter', this.onmouseover)
                  .on('mouseout', function(d) {
                    return tooltipCircle.transition().style("opacity", 0);
                  })
                  .on('mousemove', function(d) {
                    tooltipCircle.style("opacity", .9);
                    var wid = tooltipCircle.style("width").replace("px", "");
                    return tooltipCircle
                      .style("left", Math.min(window.innerWidth - wid - 20,
                        Math.max(0, (d3.event.pageX - wid/2))) + "px")
                      .style("top", (d3.event.pageY + 40) + "px")
                      .style("width", wid + "px");
                  });    
   
                var rLittleCircle = formatPercent2(p["avg_" + order]) / 100 * rBigCircle;
                histo.append("circle")
                  .attr("cx", 25)
                  .attr("cy", -40)
                  .attr("r", rLittleCircle)
                  .style("stroke", "#333")  
                  .style("fill", "#333")
                  .on('mouseover', function(d) {
                  return tooltipCircle.html(
                    "<p>Total : " + formatPercent(p["avg_" + order]) + "</p>"
                    ).transition().style("opacity", .9);
                  })
                  //.on('mouseenter', this.onmouseover)
                  .on('mouseout', function(d) {
                    return tooltipCircle.transition().style("opacity", 0);
                  })
                  .on('mousemove', function(d) {
                    tooltipCircle.style("opacity", .9);
                    var wid = tooltipCircle.style("width").replace("px", "");
                    return tooltipCircle
                      .style("left", Math.min(window.innerWidth - wid - 20,
                        Math.max(0, (d3.event.pageX - wid/2))) + "px")
                      .style("top", (d3.event.pageY + 40) + "px")
                      .style("width", wid + "px");
                  });  

                  histo.append("text")
                    .attr("class", "legend")
                    .attr("x", 18)
                    .attr("y", -17)
                    .attr("font-size", "0.8em")
                    .text(function(d){ return formatPercent(p["avg_" + order]) })
                  
              }

          });

        // // Legend circle
        // var circleLegend = d3.select("#circleLegend").append("svg")

        // circleLegend.append("circle")
        //             .attr("cx", 10)
        //             .attr("cy", 5)
        //             .attr("r", 12)
        //             .style("stroke", "#777") 
        //             .style("fill", "transparent")

        }
      } //end of link
    }
  }])