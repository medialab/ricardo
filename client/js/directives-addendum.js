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
           y.domain([0, d3.max( data.filter(function(d){ return d.year >= scope.startDate && d.year <= scope.endDate}), function(d) { return Math.max( d.imp, d.exp ); })]);

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
                }
              }

            function mouseout(d) {
                focus.attr("transform", "translate(-100,-100)");
              }
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
  .directive('brushingTimeline', [
    function(                       ){
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
  .directive('partnersHistogram', ['cfSource', 'cfTarget', 'fileService', 'apiService', '$timeout', function (cfSource, cfTarget, fileService, apiService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      link: function(scope, element, attrs) {

        var histogram = ricardo.partnersHistogram()
            //.width(element.width())
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

        scope.$watch("gbContinent", function(newValue, oldValue){
          if(newValue !== oldValue){
            chart.call(histogram.continents(newValue));
          }
        });
        scope.$watch("order", function(newValue, oldValue){
          if(newValue !== oldValue){
            chart.call(histogram.order(newValue))
          }
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
          
            newValue.forEach(function(e){
                e.color=scope.reporting.filter(function(r){return r.RICid===e.key})[0]["color"]})

            chart.datum(newValue).call(linechart)
          }
        })

        scope.$watch("yValue", function(newValue, oldValue){
          if(newValue !== oldValue){
            chart.call(linechart.yValue(newValue))
          }
        })

      }
    }
  }])
 
