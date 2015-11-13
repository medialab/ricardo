'use strict';

/* Directives */

angular.module('ricardo.directives-addendum', [])

  .directive('navbar',[ 'fileService', '$timeout', function (fileService, $timeout){
    return {
      restrict: 'A',
      replace: false,
      templateUrl: 'partials/navbar.html',
      link: function(scope, element, attrs) {

      }
    }
  }])
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
  .directive('linechartTitle', [function() {
    return {
      restrict: 'E'
      ,templateUrl: 'partials/linechartTitle.html'
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
  /* directive with only template */
  .directive('inlineSelectCurrency', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/inlineSelectCurrency.html'
      ,scope: {
          model: '=ngModel'
        , list: '=list'
      }
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
              .transition().duration(750)
              .call(xAxis);

          svg.select(".y.axis")
              .transition().duration(750)
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
              ImpExp.push({type:"imp", points: data.imp, year: data.year});
              ImpExp.push({type:"exp", points: data.exp, year: data.year});
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
                    .attr("class", "focus")

                  }

            focus.append("circle")
                .attr("r", 3)

            focus.append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")

            // svg.append("rect")
            //     .attr("x", 100)
            //     .attr("y", 100)
            //     .attr("width", 10)
            //     .attr("heigth", 15)

            var format = d3.format("0,000");

            function mouseover(d) {
              if(d[yValue]!=null)
              {
                var colorPoint = d.type === "imp" ? "#CC6666" : "#663333"

                focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                focus.select("text")
                  .attr("fill", colorPoint)
                  .text(format(Math.round(d[yValue])) + ' £');
                  
                /* vertical line */
                svg.append("line")
                     .attr("class", "lineDate")
                     .attr("x1", x(new Date(d.year, 0, 1)))
                     .attr("y1", y(d[yValue]))
                     .attr("x2", x(new Date(d.year, 0, 1)))
                     .attr("y2", 142)
                     .attr("stroke-width", 1)
                     .attr("stroke", "grey");

                // add date
                var text = svg.append("text")
                     .attr("class", "lineDateText")
                     .attr("x", x(new Date(d.year, 0, 1)) - 15)
                     .attr("y", 157)
                     .attr("font-size", "0.85em")
                     .text(d.year);


                // Define the gradient
                var gradient = svg.append("svg:defs")
                    .append("svg:linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                // Define the gradient colors
                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 0.1);

                gradient.append("svg:stop")
                    .attr("offset", "50%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 1);

                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#f5f5f5")
                    .attr("stop-opacity", 0.1);

                // add rect as background to hide date display in 
                var bbox = text.node().getBBox();
                var rect = svg.append("svg:rect")
                    .attr("class", "lineDateText")
                    .attr("x", bbox.x - 50)
                    .attr("y", bbox.y)
                    .attr("width", bbox.width + 100)
                    .attr("height", bbox.height)
                    .style("fill", 'url(#gradient)')


                // add date
                var textDate = svg.append("text")
                     .attr("class", "lineDateText")
                     .attr("x", x(new Date(d.year, 0, 1)) - 15)
                     .attr("y", 157)
                     .attr("font-size", "0.85em")
                     .text(d.year);
              }
            }

          function mouseout(d) {
              svg.selectAll("line.lineDate").remove();
              svg.selectAll("text.lineDateText").remove();
              svg.selectAll("rect.lineDateText").remove();
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
            //console.log("scope.ngData 1", scope.ngData);
            draw(scope.ngData)
          }
        })

        scope.$watch('endDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            //console.log("scope.ngData 2", scope.ngData);
            draw(scope.ngData)
          }
        })

        scope.$watch('startDate', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
            //console.log("scope.ngData 3", scope.ngData);
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
          var ComparisonTabData = [];

          data.forEach(function (data) {
            if (data.year >= scope.startDate && data.year <= scope.endDate) {
              var source = diffSource(data);
              var target = diffTarget(data);
              if ( source !== undefined) {
                ComparisonTabData.push({type: "source", points: source, year: data.year}); 
              }
              if (target !== undefined) {
                ComparisonTabData.push({type: "target", points: target, year: data.year});
              }
            }
          })
          voronoi(ComparisonTabData, "points", svg, margin, height, width);

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
                .data(voronoi(data.filter(function(d){ 
                  // if(d.points !== "-Infinity" && !isNaN(d.points) ) { 
                    return d[yValue] !== null 
                  // } 
                })))

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
                  var colorPoint = d.type === "source" ? "#CC6666" : "#dbb994"
                  focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                  focus.select("text").attr("fill", colorPoint).text(format(Math.round(d[yValue] * 100) / 100 ));
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
              svgHeight = scope.mirrorLines ? 140 : 70,
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

          // baselines

          var entityDataAvaible = scope.sourceCountry ? scope.sourceCountry : "World";
          
          svg.append("text")
              .attr("class", "baselineLabel")
              .text(entityDataAvaible)
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
                .text(scope.targetCountry)
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
        sortDate: '=',
        filterData: '='
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function(newValue, oldValue){
          if(newValue !== oldValue){
            removeSvgElements(chart)            
            partnersHistogram(newValue, continents, order, filtered, scope.startDate, scope.endDate);
          }
        }, true);

        scope.$watch("groupData", function(newValue, oldValue){
          if (newValue !== oldValue) {
            removeSvgElements(chart)
            continents = newValue;
            partnersHistogram(scope.ngData, continents, order, filtered, scope.startDate, scope.endDate);
          }
        }, true);

        scope.$watch("orderData", function(newValue, oldValue){
            if (newValue !== oldValue) {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, continents, newValue, filtered, scope.startDate, scope.endDate);
            }
        }, true);

        // uncomments these lines to use filter selection with calcul on all data
        scope.$watch("filterData", function (newValue, oldValue){
          if(newValue !== oldValue){
            if(newValue === "all") {
              removeSvgElements(chart)
              partnersHistogram(scope.ngData, continents, order, newValue, scope.startDate, scope.endDate);
            }
            else {
              removeSvgElements(chart) 
              //var data=scope.ngData.filter(function(p){return p.type === newValue})
              // if (data.length === 0){
              //   noData ();
              // }
              partnersHistogram(scope.ngData, continents, order, newValue, scope.startDate, scope.endDate);
            } 
          }
        })


        // var transmit by scope affectation
        var RICentities = scope.countryData, 
            continents = scope.groupData ? scope.groupData : 1, 
            order = scope.orderData ? scope.orderData : "tot",
            filtered = scope.filterData ? scope.filterData : "all";

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
            partnersHistogram(scope.ngData, continents, order, filtered, scope.startDate, scope.endDate);
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

        function partnersHistogram(data, continents, order, filtered, minDate, maxDate){
          
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
          
          //console.log("data 3", data);
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
            //console.log("p", p)
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

          partners.sort(function(a,b){
            if (order === 'name') 
              return d3.ascending(a.key, b.key);
            else return d3.descending(a["avg_" + order], b["avg_" + order]);
          });


          partners = partners.sort(function(a,b){
             return d3.descending(a["avg_" + order], b["avg_" + order]);
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
                .domain(d3.extent(years))
                .range([0, width]), // witdh replace max width 
                y = d3.scale.linear()
                .range([0, barMaxHeigth/2]);


          partners.forEach(function(p, i){
            //console.log("p", p);

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
       /* directive with watch, update and draw functions */
  .directive('barChart', [function(){
    return {
      restrict: 'E'
      ,template: '<div id="bar-chart-container"></div>'
      ,scope: {
        ngData: '='
        ,startDate: '='
        ,endDate: '='
      }
      ,link: function(scope, element, attrs){
        scope.$watch('ngData', function(newValue, oldValue) {
          if ( newValue && scope.ngData) {
              barChart(scope.ngData, scope.startDate, scope.endDate);
          }
        });

        var tooltipBar = d3.select("body")
          .append("div")
          .attr("class", "circle-tooltip");

        var brush

        function barChart(data, start, end) {
            
            var margin = {top: 20, right: 0, bottom: 40, left: 0},
                width = document.querySelector('#dual-timeline-container').offsetWidth,
                height = 60;
            
            var x = d3.time.scale()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("right")
                .ticks(4)
                .tickSize(0);

            var svg = d3.select("#bar-chart-container").append("svg")
                .attr("width", width )
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([new Date(start, 0, 1), new Date(end, 0, 1)]);
            y.domain([0, d3.max(data, function(d) { return d.nb_reporting; })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);

              function customAxis(g) {
                g.selectAll("text")
                  .attr("x", 4)
                  .attr("dy", -4)
                  .attr("font-size", "0.85em");
                }

              var expNbReportings = data.filter(function (d) { return d.type === "Exp"});
              var impNbReportings = data.filter(function (d) { return d.type === "Imp"});
              
              var endStart = (end-start);
              var barWidth = Math.floor(width / endStart);

                  /* 50 line */
              svg.append("line")
                   .attr("x1", 0)
                   .attr("y1", y(50))
                   .attr("x2", width)
                   .attr("y2", y(50))
                   .attr("stroke-width", 1)
                   .attr("stroke", "grey");

                  /* 100 line */
              svg.append("line")
                   .attr("x1", 0)
                   .attr("y1", y(100))
                   .attr("x2", width)
                   .attr("y2", y(100))
                   .attr("stroke-width", 1)
                   .attr("stroke", "grey");

              svg.selectAll(".bar")
                  .data(impNbReportings)
                .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d) { return x(new Date(d.year, 0, 1)) })
                  .attr("width", barWidth)
                  .attr("y", function(d) { return y(d.nb_reporting); })
                  .attr("height", function(d) { return height - y(d.nb_reporting); })
                  .style({fill: "#cc6666"})
                  .on('mouseover', function(d) {
                  return tooltipBar.html(
                    "<p>Nb reportings : " + d.nb_reporting + "</p>"
                    ).transition().style("opacity", .9);
                  })
                  .on('mouseout', function(d) {
                    return tooltipBar.transition().style("opacity", 0);
                  })
                  .on('mousemove', function(d) {
                    tooltipBar.style("opacity", .9);
                    var wid = tooltipBar.style("width").replace("px", "");
                    return tooltipBar
                      .style("left", Math.min(window.innerWidth - wid - 20,
                        Math.max(0, (d3.event.pageX - wid/2))) + "px")
                      .style("top", (d3.event.pageY + 40) + "px")
                      .style("width", wid + "px");
                  });

            function type(d) {

              d.nb_reporting = +d.nb_reporting;
              return d;
            }

                      // Brush

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
                .attr("height", height);
          }else{
            gBrush
              .call(brush)
              .call(brush.event);
          }

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
          d3.select("#bar-chart-container svg").select(".brush").call(brush)
        }
      }
    }
         
  }])
  // /* directive with only watch */
  .directive('linechartWorld',[ 'fileService', 'apiService', '$timeout',function (fileService, apiService, $timeout){
    return {
      restrict: 'E',
      template: '<div id="linechart-world-container"></div>',
      scope: {
        ngData: '='
      },
      link: function(scope, element, attrs) {

        function noData(entity) {
          d3.select("#linechart-world-container").append("div")
            .attr("class", "alert")
            .attr("id", "missingDataLineChart")
            .html(function() {
               return '<div class="modal-body" ><p> There is <strong>no data available</strong> in the database for '+ entity + '</p><p>Choose another one or change date selection, thank you !</p> </div> <div class="modal-footer"><button class="btn btn-default" ng-click="okPartner()">OK</button></div>';})
            .on("click", function(){
              chart.selectAll("div#missingDataLineChart").remove();
            })
        }

        var chart = d3.select(element[0])

        scope.$watch("ngData", function(newValue, oldValue){
          
          if(newValue && newValue !== oldValue && newValue.length > 0){      
            newValue.forEach(function (e) {
              if (e.color === undefined)
                e.color=scope.reporting.filter(function(r){return r.RICid===e.key})[0]["color"]
            })
             
            var yValueSterling;
            var yValueSelect;

            if (newValue.flowType)
              yValueSelect = newValue.flowType
            else
              yValueSelect = newValue[0].type ? newValue[0].type : newValue[0].flowType;           

            var missing;
            var allExpNull = newValue[0].values.every(function (d) {return d.exp === null ;})
            var allImpNull = newValue[0].values.every(function (d) {return d.imp === null ;})

            for (var i = 0, len = newValue.length; i < len ; i++)
            {
              var allExpNull = newValue[0].values.every(function (d) {return d.exp === null ;})
              var allImpNull = newValue[0].values.every(function (d) {return d.imp === null ;})
              if (allExpNull && allImpNull)
                noData(newValue[i].values[0].reporting_id)
            }
            linechart(newValue, yValueSelect);
          }
        })

        var height = 400,
            width = document.querySelector('#linechart-world-container').offsetWidth,
            sort = [],
            yValue = 'total',
            duration = 500;

        var selection = d3.select("#linechart-world-container");

        function linechart(data, yValue){
          var chart;
          var margin = {top: 20, right: 0, bottom: 30, left: 0},
              chartWidth = width - margin.left - margin.right,
              chartHeight = height - margin.top - margin.bottom;

          if (selection.select('svg').empty()){
            chart = selection.append('svg')
            .attr('width', width)
            .attr('height', height)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          }
          else
          {
            chart = selection.select('svg')
            .attr('width', width)
            .attr('height', height)
              .select("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          }

          var x = d3.time.scale()
              .range([0, chartWidth]);

          var y = d3.scale.linear()
              .range([chartHeight, 0]);

          // var colorDomain = sort;

          var yMax = d3.max(data, function(elm) {return d3.max(elm.values, function(d) { return d[yValue]; }); });
          var xMax = d3.max(data, function(elm) {return d3.max(elm.values, function(d) { return new Date(d.year, 0, 1) }); });
          var xMin = d3.min(data, function(elm) {return d3.min(elm.values, function(d) { return new Date(d.year, 0, 1) }); });

          x.domain([xMin,xMax])
          y.domain([0,yMax])

         /* axis */

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("right")
              .ticks(5)
              .tickSize(width)
              //.tickFormat(d3.format("s"))
              .tickFormat(function(d,i){
                var prefix = d3.formatPrefix(d)
                if(i == 0){
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

          var gy = chart.select("g.y.axis"),
              gx = chart.select("g.x.axis");

          if(chart.select("g.x.axis").empty() || chart.select("g.y.axis").empty()){

            gx = chart.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + chartHeight + ")")
              .call(xAxis);

            gy = chart.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .call(customAxis);
                
            gy.selectAll("g").filter(function(d) { return d; })
                .classed("minor", true);
            }
            else {

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

         /* lines */

          var line = d3.svg.line()
              .defined(function(d) {return d[yValue]; })
              .x(function(d) { return x(new Date(d.year, 0, 1)); })
              .y(function(d) { return y(d[yValue]); });

          var entities = chart.selectAll(".line")
              .data(data, function(d){return d.key});

          var enter = entities.enter()
                .append("path")
                  .attr("class", "line")
                  .attr("stroke", function(d,i) { return d["color"]; })
                  .attr("fill", "none")
                  .attr("stroke-width", "2px")
            
          entities
            .attr("d", function(d) { return line(d.values); })
            .attr("stroke", function(d,i) { return d["color"]; })
            .attr("fill", "none")

          entities.exit().remove()

          var voronoi = d3.geom.voronoi()
            .x(function(d) { return x(new Date(d.year, 0, 1)); })
            .y(function(d) { return y(d[yValue]); })
            .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
          
          var voronoiGroup = chart.select(".voronoi")

          if(voronoiGroup.empty()){
            voronoiGroup = chart.append("g")
                        .attr("class", "voronoi")
                        .attr("fill", "none")
                        .attr("pointer-events", "all")
          }

          var voronoiGraph = voronoiGroup.selectAll("path")
            .data(voronoi(d3.merge(data.map(function(d) { return d.values.filter(function(d){return d[yValue]}); }))))
              
          voronoiGraph.attr("d", function(d) { if(d!==undefined) return "M" + d.join("L") + "Z"; })
            .datum(function(d) { if(d!==undefined) return d.point; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);


          voronoiGraph
            .enter().append("path")
            .attr("d", function(d) { 
              if (d !== null) return "M" + d.join("L") + "Z"; })
            .datum(function(d) {return d.point ; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

          voronoiGraph.exit().remove()

          var focus = chart.select(".focus")
                    
          if(focus.empty()){
            focus = chart.append("g")
                .attr("transform", "translate(-100,-100)")
                .attr("class", "focus");
            }

          focus.append("circle")
            .attr("r", 3);

          focus.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")

          var format = d3.format("0,000");

          function colorLine(country) {
            var color;
            data.forEach(function (d) {
              if (d.key === country)
                color = d.color;
            })
            return color;
          }

          function mouseover(d) {
            if (d !== undefined) {
              if(d[yValue]!==null && d[yValue]!==undefined)
              {
                var colorPoint = colorLine(d.reporting_id);
                focus.attr("transform", "translate(" + x(new Date(d.year, 0, 1)) + "," + y(d[yValue]) + ")");
                if (d.value)
                  focus.select("text").attr("fill", colorPoint).text(format(Math.round(d[yValue])) + ' %');
                else
                  focus.select("text").attr("fill", colorPoint).text(format(Math.round(d[yValue])) + ' £');

                chart.append("line")
                       .attr("class", "lineDate")
                       .attr("x1", x(new Date(d.year, 0, 1)))
                       .attr("y1", y(d[yValue]))
                       .attr("x2", x(new Date(d.year, 0, 1)))
                       .attr("y2", 350)
                       .attr("stroke-width", 1)
                       .attr("stroke", "grey");
               var text = chart.append("text")
                       .attr("class", "lineDate")
                       .attr("x", x(new Date(d.year, 0, 1)) - 15)
                       .attr("y", 368)
                       .attr("font-size", "0.85em")
                       .text(d.year);

                // Define the gradient
                  var gradient = chart.append("chart:defs")
                      .append("chart:linearGradient")
                      .attr("id", "gradient")
                      .attr("x1", "0%")
                      .attr("y1", "100%")
                      .attr("x2", "100%")
                      .attr("y2", "100%")
                      .attr("spreadMethod", "pad");

                  // Define the gradient colors
                  gradient.append("chart:stop")
                      .attr("offset", "0%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 0.1);

                  gradient.append("chart:stop")
                      .attr("offset", "50%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 1);

                  gradient.append("chart:stop")
                      .attr("offset", "100%")
                      .attr("stop-color", "white")
                      .attr("stop-opacity", 0.1);

                  // add rect as background to hide date display in 
                  var bbox = text.node().getBBox();
                  var rect = chart.append("chart:rect")
                      .attr("class", "lineDateText")
                      .attr("x", bbox.x - 50)
                      .attr("y", bbox.y)
                      .attr("width", bbox.width + 100)
                      .attr("height", bbox.height)
                      .style("fill", 'url(#gradient)')


                  // add date
                  var textDate = chart.append("text")
                       .attr("class", "lineDateText")
                       .attr("x", x(new Date(d.year, 0, 1)) - 15)
                       .attr("y", 368)
                       .attr("font-size", "0.85em")
                       .text(d.year);
              }
              
            }
          }

          function mouseout(d) {
            chart.selectAll("line.lineDate").remove();
            chart.selectAll("text.lineDate").remove();
            chart.selectAll("text.lineDateText").remove();
            chart.selectAll("rect.lineDateText").remove();
            focus.attr("transform", "translate(-100,-100)");
          }     
        } // end linechart
      }
    }
  }])