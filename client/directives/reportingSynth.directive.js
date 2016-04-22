'use strict';

/* Directives */
angular.module('ricardo.directives.reportingSynth', [])
  /* directive with watch, update and draw functions */
  .directive('reportingSynth', [function(){
    return {
      restrict: 'E',
      template: '<div id="reporting-synth-container"></div>',
      scope: {
        ngData: '=',
        flowType: "=",
        category: "="
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue){
            	draw(newValue);
            }
        });

        scope.$watch('flowType', function(newValue, oldValue) {
          if ( newValue!==oldValue && scope.ngData ) {
            yValue=newValue.type.value;
            yName=newValue.name.value;
          }
        })

        scope.$watch('category', function(newValue, oldValue) {
          if (newValue) {
            category=newValue.type.value;
            // draw(scope.ngData);
          }
        })

        // var partnerColors = {
        //       "World_best_guess":"#bf6969",
        //        "World sum partners":"#bfbf69" ,
        //        "World as reported":"#69bf69",
        //        "World estimated":"#bf69bf",
        // }
        var partnerColors=d3.scale.category10()

        function colorByContinent(continent) {
          return continentColors[continent]
        }

        var margin = {top: 20, right: 0, bottom: 40, left: 0 },
            width = document.querySelector('#reporting-synth-container').offsetWidth-margin.left-margin.right,
            height=100,
            offsetHeight=10;
        var bisector = d3.bisector(function(d) {return d.year;}).left;

        var yValue=scope.flowType.type.value;
        var yName=scope.flowType.name.value;
        var category=scope.category.type.value;


        var color = d3.scale.category10();
        var format = d3.format("0,000");
        var duration=300;

        var x = d3.time.scale()
                  .range([0, width]);

        var y = d3.scale.linear()
                  .range([height, 0])


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10)

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("left")
                      .ticks(2)
                      .tickSize(-width)
                      // .tickFormat(function(d,i){
                      //   if(i == 0){
                      //     return
                      //   }
                      //   else return valueFormat(d);
                      // })


        function customAxis(g) {
          g.selectAll("text")
            .attr("text-anchor","end")
            .attr("x", width)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }
        var svg = d3.select("#reporting-synth-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);


        var line = d3.svg.line()
                    .defined(function(d) { return d.values.nb_reporting!==null; })
                    .x(function(d) { return x(new Date(d.key,0,1));})
                    .y(function(d) { return y(d.values.nb_reporting); });

        // var voronoi = d3.geom.voronoi()
        //         .x(function(d) { return x(new Date(d.year,0,1)); })
        //         .y(function(d) { return y(d.y0+d.y/2); })
        //         // .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        //         .clipExtent([[0,0],[width,height]])

        // var bisect = d3.bisector(function(d) { return d.date;}).left;


        function draw(data) {

          var minDate=d3.min(data[0].values,function(d){return d.key});
          var maxDate=d3.max(data[0].values,function(d){return d.key});

          var maxReporting=d3.max(data, function(d) {
            return d3.max(d.values,function(v){
              return v.values.nb_reporting
            })
          });

          var color_domain=data.map(function(d){return d.key;}).sort(function(a, b){ return d3.descending(a, b)})
          color.domain(color_domain)

          x.domain([new Date(minDate,0,1), new Date(maxDate,0,1)]);
          y.domain([0,maxReporting])
          svg.selectAll("g").remove()
          var multi_g=svg.selectAll(".multiple")
                          .data(data)
                  multi_g.enter()
                        .append("g")
                        .attr("class", "multiple")
                        .each(function(d,i) {
                          var e = d3.select(this);
                          // e.append("path")
                          //       .attr("class", "area-total")
                          //       .attr("d", function(d) { return area(d.values); })
                          //       .style("pointer-events","none")
                          e.append("path")
                                  .attr("class", "line")
                                  .attr("d", function(d) {return line(d.values); })
                                  .style("fill","none")
                                  .style("stroke",function(){return color(d.key)})
                                  .style("stroke-width", 1.5)
                                  .style("pointer-events","none")
                        })
                  svg.append("g")
                          .attr("class", "y axis")
                          .call(yAxis)
                          .call(customAxis)
                          .style("pointer-events","none")

                  svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0,"+height+")")
                    .call(xAxis)
                    .style("pointer-events","none");
        }//end draw function
      }
    }
  }])