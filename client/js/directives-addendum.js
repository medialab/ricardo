'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])

  /* directive with only template */
  .directive('bilateralTitle', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/bilateralTitle.html'
    }
  }])

  /* directive with only template */
  .directive('countryTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/countryTitle.html'
    }
  }])

  /* directive with only template */
  .directive('worldTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/worldTitle.html'
    }
  }])

  /* directive with only template */
  .directive('inlineSelectCountry', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectCountry.html'
      ,scope: {
          model: '=ngModel'
        , list: '=list'
      }
    }
  }])

  /* directive with only watch */
  .directive('inlineSelectYear', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectYear.html'
      ,scope: {
          rawModel: '=ngModel'
        , rawList: '=list'
      }
      ,link: function(scope, element, attrs){
        if(scope.rawModel && scope.rawList){
          scope.model = { name: '' + scope.rawModel, value: Number(scope.rawModel) }
          scope.list = scope.rawList.map(function(d){ return { name: '' + d, value: Number(d) } })
        }

        scope.$watch('rawList', function(newValue, oldValue) {
          if ( newValue ) {
            scope.list = scope.rawList.map(function(d){ return { name: '' + d, value: Number(d) } })
          }
        })

        scope.$watch('rawModel', function(newValue, oldValue) {
          if ( newValue ) {
            scope.model = { name: '' + scope.rawModel, value: Number(scope.rawModel) }
          }
        })

        scope.$watch('model', function(newValue, oldValue) {
          if ( newValue ) {
            scope.rawModel = newValue.value
          }
        })

      }
    }
  }])

  /* directive with only watch */
  .directive('inlineSelectFilter', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectFilter.html'
      ,scope: {
          model: '=ngModel'
        , list: '=list'
      }
      // ,link: function(scope, element, attrs){
      //   if(scope.rawModel && scope.rawList){
      //     scope.model = { name: '' + scope.rawModel, value: Number(scope.rawModel) }
      //     scope.list = scope.rawList.map(function(d){ return { name: '' + d, value: Number(d) } })
      //   }

      //   scope.$watch('rawList', function(newValue, oldValue) {
      //     if ( newValue ) {
      //       scope.list = scope.rawList.map(function(d){ return { name: '' + d, value: Number(d) } })
      //     }
      //   })

      //   scope.$watch('rawModel', function(newValue, oldValue) {
      //     if ( newValue ) {
      //       scope.model = { name: '' + scope.rawModel, value: Number(scope.rawModel) }
      //     }
      //   })

      //   scope.$watch('model', function(newValue, oldValue) {
      //     if ( newValue ) {
      //       scope.rawModel = newValue.value
      //     }
      //   })

      // }
    }
  }])
  /* directive with watch, update and draw functions */
  .directive('dualTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="dual-timeline-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })
       
        var x
          , y
          , xAxis
          , yAxis
          , areaImp
          , areaExp
          , lineImp
          , lineExp
          
        function draw(data){
          document.querySelector('#dual-timeline-container').innerHTML = null;

          var margin = {top: 10, right: 0, bottom: 30, left: 0},
              width = document.querySelector('#dual-timeline-container').offsetWidth - margin.left - margin.right,
              height = 180 - margin.top - margin.bottom;

          /* config axis */
          x = d3.time.scale()
              .range([0, width]);

          y = d3.scale.linear()
              .range([height, 0]);

          xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(4)
              .tickSize(0)
              .tickFormat(function(d,i){
                var prefix = d3.formatPrefix(d)
                if(i === 0){
                  return
                }
                else{
                  var symbol;
                  if(prefix.symbol === "G"){
                    symbol = "billion"
                  }else if(prefix.symbol === "M"){
                    symbol = "million"
                  }else if(prefix.symbol === "k"){
                    symbol = "thousand"
                  }else{
                    symbol = ""
                  }
                  return prefix.scale(d) + " " + symbol
                } 
              })

           x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
           y.domain([0, d3.max( data.filter(function(d){  return d.year >= scope.startDate && d.year <= scope.endDate}), function(d) { return Math.max( d.imp, d.exp ); })]);

          /* draw areas & lines */
          areaImp = d3.svg.area()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.imp); });

          lineImp = d3.svg.line()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.imp); });

          areaExp = d3.svg.area()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.exp); });

          lineExp = d3.svg.line()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.exp); });

          var svg = d3.select("#dual-timeline-container").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          data.forEach(function(d){
            d.date = new Date(d.year, 0, 1)
          })

          svg.select(".x.axis")
              //.duration(750)
              .call(xAxis);

          svg.select(".y.axis")
              //.duration(750)
              .call(yAxis);

          svg.append("path")
              .datum(data)
              .attr("class", "area-imp")
              .attr("d", areaImp);

          svg.append("path")
              .datum(data)
              .attr("class", "line-imp")
              .attr("d", lineImp)
          
          svg.append("path")
              .datum(data)
              .attr("class", "area-exp")
              .attr("d", areaExp)

          svg.append("path")
              .datum(data)
              .attr("class", "line-exp")
              .attr("d", lineExp)

          /* add axis to svg */
          var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

          if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {

            gx = svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            gy = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);
                
            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);

          } else {

            gx.transition().duration(duration)
              .call(xAxis)

            gy.transition().duration(duration)
              .call(yAxis)
              .call(customAxis);

            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);      
          }

          function customAxis(g) {
            g.selectAll("text")
              .attr("x", 4)
              .attr("dy", -4)
              .attr("font-size", "0.85em");
            }

          /* select only imp & exp data from country selected */
          var ImpExp = [];
          data.forEach(function (data) {
            if (data.year >= scope.startDate && data.year <= scope.endDate) {
              ImpExp.push({points: data.imp, year: data.year});
              ImpExp.push({points: data.exp, year: data.year});
            }
          })

          voronoi(ImpExp, "points", svg, margin, height, width);
          
        }
          /* voronoi fonction */
          function voronoi(data, yValue, svg, margin, height, width) {
            
            var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        
            var voronoiGroup = svg.select(".voronoi")

            if(voronoiGroup.empty()){
                  voronoiGroup = svg.append("g")
                              .attr("class", "voronoi")
                              .attr("fill", "none")
                              .attr("pointer-events", "all")
                              //.attr("stroke", "black")
                }

            var voronoiGraph = voronoiGroup.selectAll("path")
                .data(voronoi(data.filter(function(d){ return d[yValue] !== null})))

            voronoiGraph
                  .enter().append("path")
                  .attr("d", function(data) { return "M" + data.join("L") + "Z"; })
                  .datum(function(d) { return d.point; })
                  .on("mouseover", mouseover)
                  .on("mouseout", mouseout);

            voronoiGraph.exit().remove()

            var focus = svg.select(".focus")
                      
            if(focus.empty()){
                focus = svg.append("g")
                    .attr("transform", "translate(-100,-100)")
                    .attr("class", "focus");
                  }

            focus.append("circle")
                .attr("r", 3);

            focus.append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")

            var format = d3.format("0,000");

            function mouseover(d) {
                if(d[yValue]!=null)
                {
                  focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                  focus.select("text").text(format(Math.round(d[yValue])));
                  /* zero line */
                  svg.append("line")
                       .attr("class", "lineDate")
                       .attr("x1", x(new Date(d.year, 0, 1)))
                       .attr("y1", y(d[yValue]))
                       .attr("x2", x(new Date(d.year, 0, 1)))
                       .attr("y2", 140)
                       .attr("stroke-width", 1)
                       .attr("stroke", "grey");

                        }
              }

            function mouseout(d) {
                svg.selectAll("line.lineDate").remove();
                focus.attr("transform", "translate(-100,-100)");
              }
          }
      }
    }
  }])

    /* directive with watch, update and draw functions */
  .directive('worldTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="world-timeline-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })
       
        var x
          , y
          , xAxis
          , yAxis
          , areaImp
          , areaExp
          , lineImp
          , lineExp
          
        function draw(data){
                   document.querySelector('#world-timeline-container').innerHTML = null;

          var margin = {top: 10, right: 0, bottom: 30, left: 0},
              width = document.querySelector('#world-timeline-container').offsetWidth - margin.left - margin.right,
              height = 180 - margin.top - margin.bottom;

          /* config axis */
          x = d3.time.scale()
              .range([0, width]);

          y = d3.scale.linear()
              .range([height, 0]);

          xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(4)
              .tickSize(0)
              .tickFormat(function(d,i){
                var prefix = d3.formatPrefix(d)
                if(i === 0){
                  return
                }
                else{
                  var symbol;
                  if(prefix.symbol === "G"){
                    symbol = "billion"
                  }else if(prefix.symbol === "M"){
                    symbol = "million"
                  }else if(prefix.symbol === "k"){
                    symbol = "thousand"
                  }else{
                    symbol = ""
                  }
                  return prefix.scale(d) + " " + symbol
                } 
              })

           x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
           y.domain([0, d3.max( data.filter(function(d){  return d.year >= scope.startDate && d.year <= scope.endDate}), function(d) { return Math.max( d.imp, d.exp ); })]);

          /* draw areas & lines */
          areaImp = d3.svg.area()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.imp); });

          lineImp = d3.svg.line()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.imp); });

          areaExp = d3.svg.area()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.exp); });

          lineExp = d3.svg.line()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.exp); });

          var svg = d3.select("#world-timeline-container").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          data.forEach(function(d){
            d.date = new Date(d.year, 0, 1)
          })

          svg.select(".x.axis")
              //.duration(750)
              .call(xAxis);

          svg.select(".y.axis")
              //.duration(750)
              .call(yAxis);

          svg.append("path")
              .datum(data)
              .attr("class", "area-imp")
              .attr("d", areaImp);

          svg.append("path")
              .datum(data)
              .attr("class", "line-imp")
              .attr("d", lineImp)
          
          svg.append("path")
              .datum(data)
              .attr("class", "area-exp")
              .attr("d", areaExp)

          svg.append("path")
              .datum(data)
              .attr("class", "line-exp")
              .attr("d", lineExp)


          /* add axis to svg */
          var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

          if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {

            gx = svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            gy = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);
                
            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);

          } else {

            gx.transition().duration(duration)
              .call(xAxis)

            gy.transition().duration(duration)
              .call(yAxis)
              .call(customAxis);

            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);      
          }

          function customAxis(g) {
            g.selectAll("text")
              .attr("x", 4)
              .attr("dy", -4)
              .attr("font-size", "0.85em");
            }

          /* select only imp & exp data from country selected */
          var ImpExp = [];
          data.forEach(function (data) {
            if (data.year >= scope.startDate && data.year <= scope.endDate) {
              ImpExp.push({points: data.imp, year: data.year});
              ImpExp.push({points: data.exp, year: data.year});
            }
          })

          voronoi(ImpExp, "points", svg, margin, height, width);
          
        }
          /* voronoi fonction */
          function voronoi(data, yValue, svg, margin, height, width) {
            
            var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        
            var voronoiGroup = svg.select(".voronoi")

            if(voronoiGroup.empty()){
                  voronoiGroup = svg.append("g")
                              .attr("class", "voronoi")
                              .attr("fill", "none")
                              .attr("pointer-events", "all")
                }

            var voronoiGraph = voronoiGroup.selectAll("path")
                .data(voronoi(data.filter(function(d){ return d[yValue] !== null})))

            voronoiGraph
                  .enter().append("path")
                  .attr("d", function(data) { return "M" + data.join("L") + "Z"; })
                  .datum(function(d) { return d.point; })
                  .on("mouseover", mouseover)
                  .on("mouseout", mouseout);

            voronoiGraph.exit().remove()

            var focus = svg.select(".focus")
                      
            if(focus.empty()){
                focus = svg.append("g")
                    .attr("transform", "translate(-100,-100)")
                    .attr("class", "focus");
                  }

            focus.append("circle")
                .attr("r", 3);

            focus.append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")

            var format = d3.format("0,000");

            function mouseover(d) {
                if(d[yValue]!=null)
                {
                  focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                  focus.select("text").text(format(Math.round(d[yValue])));
                  /* zero line */
                  svg.append("line")
                       .attr("class", "lineDate")
                       .attr("x1", x(new Date(d.year, 0, 1)))
                       .attr("y1", y(d[yValue]))
                       .attr("x2", x(new Date(d.year, 0, 1)))
                       .attr("y2", 140)
                       .attr("stroke-width", 1)
                       .attr("stroke", "grey");

                        }
              }

            function mouseout(d) {
                svg.selectAll("line.lineDate").remove();
                focus.attr("transform", "translate(-100,-100)");
              }
          }
      }
    }
  }])
   /* directive with watch, update and draw functions */
  .directive('scatterPlot', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="scatter-plot-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
      }
      ,link: function(scope, element, attrs){
        // scope.$watch('ngData', function(newValue, oldValue) {
        //   if ( newValue && scope.ngData) {
        //     scatterPlot(scope.ngData, scope.startDate);
        //   }
        // });

        // scope.$watch('startDate', function(newValue, oldValue) {
        //   if ( newValue && scope.ngData) {
        //     scatterPlot(scope.ngData, scope.startDate);
        //   }
        // });

        

        function sleep(milliseconds) {
          var start = new Date().getTime();
          for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
              break;
            }
          }
        }

        scope.play = function () {
          for (i = 1787; i < 1938; i++) {
            scatterPlot(scope.ngData, i);
            sleep(1000);
          }
        }


        /* 
          filter without world sum to have a good graph

        */

        document.querySelector('#scatter-plot-container').innerHTML = null;
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = document.querySelector('#scatter-plot-container').offsetWidth - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#scatter-plot-container").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        d3.select("#slider-time").on('change', function(d) {
          svg.selectAll(".dot").remove();
          svg.selectAll(".legend").remove();
          svg.selectAll("rect.text").remove();
          svg.selectAll("text").remove();
          svg.selectAll("x").remove();
          svg.selectAll("y").remove();
          svg.selectAll("g").remove();
          svg.selectAll("axis.label").remove();
          svg.selectAll("axis.tick").remove();
          var current = parseInt(this.value);
          scatterPlot(scope.ngData, current, svg, margin, width, height);
        });


        function scatterPlot (data, date, svg, margin, width, height) {

          //var max = d3.max(data.)
          var tab = [];
          data.forEach(function (d) {
            //console.log("d : ", d);
            if (d.year === date && d.partner_id !== "Worldsumpartners" && d.partner_id !== "Worldbestguess" && d.partner_id !== "Worldasreported" && d.partner_id !== "Worldasreported2") {
              tab.push(d.exp);
              //console.log("d pays", d.partner_id, "d exp : ", d.exp);
              tab.push(d.imp);
              //console.log("d pays", d.partner_id, "d imp : ", d.imp);
              // console.log("d.year : ", d.year);
              // console.log("date: ", date);  
            }
          });
          //console.log("tab : ", tab);
          var max = d3.max(tab);
          //console.log("max : ", max);


          var x = d3.scale.linear()
              .domain([0,max])
              .range([0, width]);

          var y = d3.scale.linear()
              .domain([0,max])
              .range([height, 0]);

          var color = d3.scale.category10();

          var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left");

            data.forEach(function(d) {
              if (d.year === date && d.partner_id !== "Worldsumpartners" && d.partner_id !== "Worldbestguess" && d.partner_id !== "Worldasreported" && d.partner_id !== "Worldasreported2") {
                d.imp = +d.imp;
                d.exp = +d.exp;     
              }
            });

            

          //   // Various scales. These domains make assumptions of data, naturally.
          // var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
          //     yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
          //     radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
          //     colorScale = d3.scale.category10();

          // x.domain(d3.extent(data, function(d) { if (d.year === date 
          //   && d.partner_id !== "Worldsumpartners" 
          //   && data.partner_id !== "Worldbestguess" 
          //   && data.partner_id !== "Worldasreported") {
          //   console.log("d.exp", d.exp); 
          //   return d.exp; }})).nice();

          // y.domain(d3.extent(data, function(d) { if (d.year === date 
          //   && d.partner_id !== "Worldsumpartners" 
          //   && data.partner_id !== "Worldbestguess" 
          //   && data.partner_id !== "Worldasreported") {
          //   console.log("d.imp", d.imp); 
          //   return d.imp; }})).nice();

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
            .append("text")
              .attr("class", "label")
              .attr("x", width)
              .attr("y", -6)
              .style("text-anchor", "end")
              .text("Exports (Sterlings)");

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("class", "label")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Imports (Sterlings)")

          var tooltip = d3.select("body")
              .append("div")
              .attr("class", "scatterPlot-tooltip");


            // absolute balance
            var tab = [];
         
            data.forEach(function (data) {
                    if (data.year === date && data.partner_id !== "Worldsumpartners" && data.partner_id !== "Worldbestguess" && data.partner_id !== "Worldasreported") {
                      var number = (data.exp-data.imp);
                      var r = 8;

                      //number = Math.abs(number);
                      tab.push({imp: data.imp, exp: data.exp, reporting_id: data.reporting_id, partner_id:data.partner_id, year:data.year, balance: r });
                    }
                  })

          //console.log("tab", tab);

          svg.selectAll(".dot")
              .data(tab)
            .enter().append("circle")
              .attr("class", "dot")
              //.attr("r", 3.5)
              .attr("cx", function(d) { return x(d.exp); })
              .attr("cy", function(d) { return y(d.imp); })
              .attr("r", function(d) { return d.balance })
              .style("fill", function(d) { return color(d.partner_id); });

          svg.selectAll("scatterPlot-tooltip")
              .data(tab)
              .enter().append("rect")
              .attr("class", "dot")
              .attr("x", function(d) { return x(d.exp); })
              .attr("y", function(d) { return y(d.imp); })
              .attr("width", 18)
              .attr("height", 18)
              .attr("opacity", 0)
              .on('mouseover', function(d) {
                      return tooltip.html(
                        // "<h3>"+ d.reporting_id + "</h3>" +
                        // "<p>Continent"+ d.continent + "</p>" +
                        "<p>Partner "+ d.partner_id + "</p>" +
                        "<p>Relative balance: "+ d.balance  + "</p>" +
                        // "<p>Year: "  +  d.year + "</p>" +
                        "<p>Export: " + d.exp + "</p>" +
                        "<p>Import: " + d.imp + "</p>"
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

          /* balance line */
          svg.append("line")
               .attr("x1", 0)
               .attr("y1", y(0))
               .attr("x2", x(max))
               .attr("y2", y(max))
               .attr("stroke-width", 1)
               .attr("stroke", "red");
              

          var legend = svg.selectAll(".legend")
              .data(color.domain())
            .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

          legend.append("rect")
              .attr("x", width - 18)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", color);

          // legend.append("text")
          // .attr("x", width - 24)
          // .attr("y", 9)
          // .attr("dy", ".35em")
          // .style("text-anchor", "end")
          // .text(function(d) { console.log("d text: ", d);return d; });

          var label = svg.append("text")
            .attr("class", "year label")
            .attr("text-anchor", "end")
            .attr("y", height - 24)
            .attr("x", width - 20)
            .text(date);
        }
      }
    }
         
  }])
     /* directive with watch, update and draw functions */
  .directive('barChart', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="bar-chart-container"></div>'
      ,scope: {
        ngData: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
              barChart(scope.ngData);
          }
        });

        function barChart(data) {
            
            var margin = {top: 20, right: 20, bottom: 30, left: 40},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");
                //.ticks(10, "%");

            var svg = d3.select("#bar-chart-container").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain(data.map(function(d) { return d.key; }));
            y.domain([0, d3.max(data, function(d) { return d.values.length; })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Countries");

            svg.selectAll(".bar")
                .data(data)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.key); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.values.length); })
                .attr("height", function(d) { return height - y(d.values.length); });


            function type(d) {

              d.values.length = +d.values.length;
              console.log("type", d);
              return d;
            }

        }
      }
    }
         
  }])
       /* directive with watch, update and draw functions */
  .directive('circlePacking', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="circle-packing-container"></div>'
      ,scope: {
        ngData: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
              circlePacking(scope.ngData);
          }
        });

        function circlePacking(data) {

          console.log("data 1: ", data);

          function toObject(arr) {
            var rv = {};
            for (var i = 0; i < arr.length; ++i)
              if (arr[i] !== undefined) rv[i] = arr[i];
            return rv;
          }

          var dataObj = toObject(data);
          dataObj.key = "world";
          dataObj.values = "values";

          console.log("dataObj", dataObj);

          data.forEach(function (d) {
            d.values.forEach(function (d) {
              d.size = 1;
            })
          })

          var diameter = 960,
              format = d3.format(",d");

          var pack = d3.layout.pack()
              .size([diameter - 4, diameter - 4])
              .value(function(d) { console.log("d pack", d); return d.size; });

          var svg = d3.select("#circle-packing-container").append("svg")
              .attr("width", diameter)
              .attr("height", diameter)
            .append("g")
              .attr("transform", "translate(2,2)");

            var node = svg.datum(data).selectAll(".node")
                .data(pack.nodes)
              .enter().append("g")
                .attr("class", function(d) { return d.values ? "node" : "leaf node"; })
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            node.append("title")
                .text(function(d) { console.log ("d node", d); return d.key + (d.values ? "" : ": " + format(d.size)); });

            node.append("circle")
                .attr("r", function(d) { return d.r; });

            node.filter(function(d) { return !d.values; }).append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.key.substring(0, d.r / 3); });

          d3.select(self.frameElement).style("height", diameter + "px");
           

        }
      }
    }
         
  }])
  /* directive with watch, update and draw functions */
  .directive('comparisonTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="comparison-timeline-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            draw(scope.ngData)
          }
        })

        var x
          , y
          , xAxis
          , yAxis
          , diffSourceLine
          , diffTargetLine
          , diffSource
          , diffSourceDefined
          , diffTarget
          , diffTargetDefined

        

        function draw(data){
          diffSource = function(d){
          if (!isNaN(d.exp) && !isNaN(d.imp) && d.imp !== null && d.exp !== null ) {
            return ( d.imp_mirror - d.exp ) / d.exp ;
          }
        }

        diffSourceDefined = function(d){
          return d.imp_mirror !== null && d.exp !== null && d.exp !== 0;
        }

        diffTarget = function(d){
          if (!isNaN(d.exp_mirror) && !isNaN(d.imp_mirror) && d.exp_mirror !== null && d.imp_mirror !== null) {
            return ( d.imp - d.exp_mirror ) / d.exp_mirror ;
          }
        }

        diffTargetDefined = function(d){
          return d.exp_mirror !== null && d.imp !== null && d.exp_mirror !== 0;
        }
          document.querySelector('#comparison-timeline-container').innerHTML = null;

          var margin = {top: 10, right: 0, bottom: 30, left: 0},
              width = document.querySelector('#comparison-timeline-container').offsetWidth - margin.left - margin.right,
              height = 180 - margin.top - margin.bottom;

          x = d3.time.scale()
              .range([0, width]);

          y = d3.scale.linear()
              .range([height, 0]);

          xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(4)
              .tickSize(0)

          x.domain([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)]);
          y.domain([
            d3.min( data.filter(function(d){ return d.year >= scope.startDate && d.year <= scope.endDate}), function(d) {
                if (diffSourceDefined(d) && diffTargetDefined(d)) {
                  return Math.min( diffSource(d), diffTarget(d) );            
                }
                else if (diffSourceDefined(d) ) {
                  return diffSource(d);
                }
                else if (diffTargetDefined(d)) {
                  return diffTarget(d);
                }  
                else {
                  return false;
                }
              }),
            d3.max( data.filter(function(d){ return d.year >= scope.startDate && d.year <= scope.endDate}), function(d) {
                if (diffSourceDefined(d) && diffTargetDefined(d)) {
                  return Math.max( diffSource(d), diffTarget(d) );            
                }
                else if (diffSourceDefined(d) ) {
                  return diffSource(d);
                }
                else if (diffTargetDefined(d)) {
                }
                else {
                  return false;
                }
              })
          ]);

          diffSourceLine = d3.svg.line()
              .defined(diffSourceDefined)
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y( diffSource(d) ); });

          diffTargetLine = d3.svg.line()
              .defined(diffTargetDefined)
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y( diffTarget(d) ); });


          var svg = d3.select("#comparison-timeline-container").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          data.forEach(function(d){
            d.date = new Date(d.year, 0, 1)
          })

          svg.select(".x.axis")
                //.duration(750)
                .call(xAxis);

          svg.select(".y.axis")
              //.duration(750)
              .call(yAxis);

          svg.append("path")
              .datum(data)
              .attr("class", "line-compare")
              .attr("d", diffSourceLine)

          svg.append("path")
              .datum(data)
              .attr("class", "line-compare-alt")
              .attr("d", diffTargetLine)

          /* zero line */
          svg.append("line")
               .attr("x1", 0)
               .attr("y1", y(0))
               .attr("x2", width)
               .attr("y2", y(0))
               .attr("stroke-width", 1)
               .attr("stroke", "grey");
        
          /* axis */

          var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

          if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {

            gx = svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            gy = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);
                
            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);

          } else {

            gx.transition().duration(duration)
              .call(xAxis)

            gy.transition().duration(duration)
              .call(yAxis)
              .call(customAxis);

            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);
            
          }

          function customAxis(g) {
            g.selectAll("text")
              .attr("x", 4)
              .attr("dy", -4)
              .attr("font-size", "0.85em");
            }

        /* select only imp & exp data from country selected */
          var ImpExp = [];

          data.forEach(function (data) {
            if (data.year >= scope.startDate && data.year <= scope.endDate) {
              var imp = diffSource(data);
              var exp = diffTarget(data);
              if ( imp !== undefined) {
                ImpExp.push({points: imp, year: data.year}); 
              }
              if (exp !== undefined) {
                ImpExp.push({points: exp, year: data.year});
              }
            }
          })
          voronoi(ImpExp, "points", svg, margin, height, width);

        }

                  /* voronoi fonction */
          function voronoi(data, yValue, svg, margin, height, width) {
            
            var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        
            var voronoiGroup = svg.select(".voronoi")

            if(voronoiGroup.empty()){
                  voronoiGroup = svg.append("g")
                              .attr("class", "voronoi")
                              .attr("fill", "none")
                              .attr("pointer-events", "all")
                              //.attr("stroke", "black")
                }

            var voronoiGraph = voronoiGroup.selectAll("path")
                .data(voronoi(data.filter(function(d){ 
                  if(d.points !== "-Infinity" && !isNaN(d.points) ) { return d[yValue] !== null } })))

            voronoiGraph
                  .enter().append("path")
                  .attr("d", function(data) { return "M" + data.join("L") + "Z"; })
                  .datum(function(d) { return d.point; })
                  .on("mouseover", mouseover)
                  .on("mouseout", mouseout);

            voronoiGraph.exit().remove()

            var focus = svg.select(".focus")
                      
            if(focus.empty()){
                focus = svg.append("g")
                    .attr("transform", "translate(-100,-100)")
                    .attr("class", "focus");
                  }

            focus.append("circle")
                .attr("r", 3);

            focus.append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")

            var format = d3.format("0,000");

            function mouseover(d) {
                if(d[yValue]!==null)
                {
                  focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                  focus.select("text").text(format(Math.round(d[yValue] * 100) / 100 ));
                }
              }

            function mouseout(d) {
                focus.attr("transform", "translate(-100,-100)");
              }
          }
      }
    }
  }])

  /* directive with watch and draw function */
  .directive('brushingTimeline', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="brushing-timeline-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
        ,rawStartDate: '='
        ,rawEndDate: '='
        ,sourceCountry: '='
        ,targetCountry: '='
        ,mirrorLines: '@'
      }
      ,link: function(scope, element, attrs){
        scope.mirrorLines = !!scope.mirrorLines;

        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue ) {
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            updateBrush()
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData ) {
            updateBrush()
          }
        })
        
        var brush

        function draw(data){

          document.querySelector('#brushing-timeline-container').innerHTML = null;

          var margin = {top: 6, right: 0, bottom: 6, left: 0},
              width = document.querySelector('#brushing-timeline-container').offsetWidth - margin.left - margin.right,
              svgHeight = scope.mirrorLines ? 140 : 90,
              height = 20,
              hOffset = svgHeight - height - margin.bottom - margin.top,
              interline = 8,
              baselineHeight_1on1 = hOffset / 2,
              baselineHeight_1on2 = scope.mirrorLines ? hOffset / 4 : baselineHeight_1on1,
              baselineHeight_2on2 = 3 * hOffset / 4

          // Curve
          var x = d3.time.scale()
              .range([0, width]);

          var y = d3.scale.linear()
              .range([height, 0]);

          var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          /* little dual time line */

          // var areaImp = d3.svg.area()
          //     .defined(function(d) { return d.imp !== null; })
          //     .x(function(d) { return x(d.date); })
          //     .y0( hOffset + height )
          //     .y1(function(d) { return hOffset + y(d.imp); });

          // var lineImp = d3.svg.line()
          //     .defined(function(d) { return d.imp !== null; })
          //     .x(function(d) { return x(d.date); })
          //     .y(function(d) { return hOffset + y(d.imp); });

          // var areaExp = d3.svg.area()
          //     .defined(function(d) { return d.exp !== null; })
          //     .x(function(d) { return x(d.date); })
          //     .y0( hOffset + height )
          //     .y1(function(d) { return hOffset + y(d.exp); });

          // var lineExp = d3.svg.area()
          //     .defined(function(d) { return d.exp !== null; })
          //     .x(function(d) { return x(d.date); })
          //     .y(function(d) { return hOffset + y(d.exp); });

          /* avaible data */

          var availImp = d3.svg.line()
              .defined(function(d) { return d.imp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return baselineHeight_1on2 - interline / 2; });

          var availExp = d3.svg.line()
              .defined(function(d) { return d.exp !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return baselineHeight_1on2 + interline / 2; });

          var availImpMirror = d3.svg.line()
              .defined(function(d) { return d.imp_mirror !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return baselineHeight_2on2 - interline / 2; });

          var availExpMirror = d3.svg.line()
              .defined(function(d) { return d.exp_mirror !== null; })
              .x(function(d) { return x(d.date); })
              .y(function(d) { return baselineHeight_2on2 + interline / 2; });

          var svg = d3.select("#brushing-timeline-container").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", svgHeight + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + ( margin.top ) + ")")

          data.forEach(function(d){
            d.date = new Date(d.year, 0, 1)
          })

          x.domain(d3.extent( data, function(d) { return d.date; }));
          y.domain([0, d3.max( data, function(d) { return Math.max( d.imp, d.exp ); })]);

          // little dual time line
          // svg.append("path")
          //     .datum(data)
          //     .attr("class", "area-imp")
          //     .attr("d", areaImp)

          // svg.append("path")
          //     .datum(data)
          //     .attr("class", "line-imp")
          //     .attr("d", lineImp)
          
          // svg.append("path")
          //     .datum(data)
          //     .attr("class", "area-exp")
          //     .attr("d", areaExp)

          // svg.append("path")
          //     .datum(data)
          //     .attr("class", "line-exp")
          //     .attr("d", lineExp)

          // baselines
          
          svg.append("text")
              .attr("class", "baselineLabel")
              .text("Available data reported by " + scope.sourceCountry)
              .attr("x", 0)
              .attr("y", baselineHeight_1on2 - interline / 2 - 8)

          svg.append("line")
              .attr("class", "importBaseline")
              .attr("x1", 0)
              .attr("y1", baselineHeight_1on2 - interline / 2)
              .attr("x2", width)
              .attr("y2", baselineHeight_1on2 - interline / 2)

          svg.append("line")
              .attr("class", "exportBaseline")
              .attr("x1", 0)
              .attr("y1", baselineHeight_1on2 + interline / 2)
              .attr("x2", width)
              .attr("y2", baselineHeight_1on2 + interline / 2)

          if ( scope.mirrorLines ){

            svg.append("text")
                .attr("class", "baselineLabel")
                .text("Available data reported by " + scope.targetCountry)
                .attr("x", 0)
                .attr("y", baselineHeight_2on2 - interline / 2 - 8)

            svg.append("line")
                .attr("class", "importBaseline")
                .attr("x1", 0)
                .attr("y1", baselineHeight_2on2 - interline / 2)
                .attr("x2", width)
                .attr("y2", baselineHeight_2on2 - interline / 2)

            svg.append("line")
                .attr("class", "exportBaseline")
                .attr("x1", 0)
                .attr("y1", baselineHeight_2on2 + interline / 2)
                .attr("x2", width)
                .attr("y2", baselineHeight_2on2 + interline / 2)

            svg.append("path")
                .datum(data)
                .attr("class", "line-imp")
                .attr("d", availImpMirror)

            svg.append("path")
                .datum(data)
                .attr("class", "line-exp")
                .attr("d", availExpMirror)
          }

          svg.append("path")
              .datum(data)
              .attr("class", "line-imp")
              .attr("d", availImp)

          svg.append("path")
              .datum(data)
              .attr("class", "line-exp")
              .attr("d", availExp)



          /* axis */

          var gy = svg.select("g.y.axis"),
              gx = svg.select("g.x.axis");

          if (svg.select("g.x.axis").empty() || svg.select("g.y.axis").empty()) {

            gx = svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + ( hOffset + height ) + ")")
              .call(xAxis);

          } else {

            gx.transition().duration(duration)
              .call(xAxis)

          }

          function customAxis(g) {
            g.selectAll("text")
              .attr("x", 4)
              .attr("dy", -4)
              .attr("font-size", "0.85em");
          }


          // Brush

          // var dispatch = d3.dispatch("brushed", "brushing")

          brush = d3.svg.brush()
            .x(x)
            .extent([new Date(scope.startDate), new Date(scope.endDate)])
            .on("brush", function(){
              if(brush.empty()){
                brush.clear()
                // dispatch.brushing(x.domain())
              }
              else{
                // dispatch.brushing(brush.extent())
              }
            })
            .on("brushend", brushended);

          function brushended() {
            if (!d3.event.sourceEvent) return; // only transition after input
            
            var extent0 = brush.extent(),
                extent1 = extent0.map(function(d){return d3.time.year(new Date(d))});

            d3.select(this).transition()
                .call(brush.extent(extent1))
                .call(brush.event);
            
            if(brush.empty()){
              brush.extent(x.domain())
              // dispatch.brushed(x.domain())
              // dispatch.brushing(x.domain())
            }
            else{
              // dispatch.brushed(brush.extent())
              // dispatch.brushing(brush.extent())
            }

            applyBrush()
            
          }
          //selection.selectAll("g.brush").remove();
          var gBrush = svg.select(".brush");

          if(gBrush.empty()){
            gBrush = svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.event);

            gBrush.selectAll("rect")
                .attr("height", svgHeight);
          }else{
            gBrush
              .call(brush)
              .call(brush.event);
          }

          // dispatch.on("brushing", function(d){
          //   // Currently wo do nothing here (no live update)
          // })
          // .on("brushed", function(d){
          //   // Currently wo do nothing here either
          // })

          function applyBrush(){
            scope.startDate = (brush.extent()[0]).getFullYear()
            scope.endDate = (brush.extent()[1]).getFullYear()
            if(!scope.$$phase) {
              scope.$apply()
            }
          }
        }

        function updateBrush(){
          brush.extent([new Date(scope.startDate, 0, 1), new Date(scope.endDate, 0, 1)])
          if(scope.rawStartDate === scope.startDate && scope.rawEndDate === scope.endDate){
            brush.clear()
          }
          d3.select("#brushing-timeline-container svg").select(".brush").call(brush)
        }
      }
    }
  }])
  
  /* directive with only watch */
  .directive('partnersHistogram', ['cfSource', 'cfTarget', 'fileService', 'apiService', '$timeout', function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

       
        var histogram = ricardo.partnersHistogram()
              .width(element.width())
        var chart = d3.select(element[0])

        var refresh = function(newValue, oldValue){
          if(newValue !== oldValue){
            chart.selectAll("text.legend").remove();
            chart.selectAll("rect.bar").remove();
            chart.datum(scope.tableData).call(histogram.RICentities(scope.RICentities));
          }
        }

        scope.$watch("tableData", refresh, true);
        scope.$watch("currency", refresh);

        scope.$watch("grouped.selected", function(newValue, oldValue){
            //console.log("oldValue", oldValue);
          if (newValue !== oldValue) {
            //console.log("newValue group", newValue.type.value);
            chart.selectAll("text.legend").remove();
            chart.selectAll("rect.bar").remove();
            chart.call(histogram.continents(newValue.type.value));
            //console.log("change group");
          }
          // if(newValue.type.value !== oldValue.type.value){
          //   chart.selectAll("text.legend").remove();
          //   chart.selectAll("rect.bar").remove();
          //   chart.call(histogram.continents(newValue.type.value));
          // }
        }, true);


        scope.$watch("ordered.selected", function(newValue, oldValue){
            //console.log("oldValue", oldValue);
            if (newValue !== oldValue) {
              //console.log("newValue order", newValue);
              chart.selectAll("text.legend").remove();
              chart.selectAll("rect.bar").remove();
              chart.call(histogram.order(newValue.type.value));
              //console.log("change");
            }

          // if(newValue !== oldValue){
          //   console.log("oldValue", oldValue);
          //   console.log("newValue", newValue);
          //   chart.selectAll("text.legend").remove();
          //   chart.selectAll("rect.bar").remove();
          //   chart.call(histogram.order(newValue))
          // }
        }, true);

      }
    }
  }])

  /* directive with only watch */
  .directive('linechartWorld',[ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout',function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

          var linechart = ricardo.linechart()
            //.width(element.width())
            .height(400)


          var chart = d3.select(element[0])

        scope.$watch("linechartData", function(newValue, oldValue){
          if(newValue !== oldValue){
            console.log("directive linechartWorld", newValue);
          
            newValue.forEach(function(e){
              //console.log("e color", e);
                e.color=scope.reporting.filter(function(r){return r.RICid===e.key})[0]["color"]})

           //console.log("newValue[0].values[0].value", newValue[0].values[0].value);

           //var yValueSelect = newValue[0].values[0].exp ? "exp" : "value";
           var yValueSelect = newValue[0].type;

            console.log("yValueSelect", yValueSelect);
            chart.datum(newValue).call(linechart.yValue(yValueSelect));
          }
           if(newValue === oldValue) {
            //console.log("noobby");
           }
        })

        // scope.$watch("yValue", function(newValue, oldValue){
        //   console.log("yvalue in linechart", newValue);
        //   if(newValue !== oldValue){
        //     chart.call(linechart.yValue(newValue))
        //   }
        // })

      }
    }
  }])
 
