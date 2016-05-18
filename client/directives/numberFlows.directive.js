'use strict';

/* Directives */
angular.module('ricardo.directives.numberFlows', [])
  /* directive with watch, update and draw functions */
  .directive('numberFlows', [function(){
    return {
      restrict: 'E',
      template: '<div id="number-flows-container"></div>',
      scope: {
        ngData: '='
      },
      link: function(scope, element, attrs) {

        scope.$watch("ngData", function (newValue, oldValue){
            if(newValue){
              var data=group_flows(newValue)
            	draw(data);
            }
        });
        
        var color=d3.scale.category10()
        function group_flows(data){

          minDate=d3.min(data,function(d){return +d.year});
          maxDate=d3.max(data,function(d){return +d.year});

          var nbFlows=d3.nest()
                  .key(function(d) {return d.partner})
                  .entries(data);

          //extend missing points with null values
          nbFlows.forEach(function(d){
              for (var i = minDate; i<= maxDate;i++){
                var years=d.values.map(function(v){ return v.year});
                if (years.indexOf(i)=== -1){
                  d.values.push({
                    year:i,
                    partner:d.key,
                    nb_flows:0
                  })
                }
              }
              //sort by year ascending
              d.values.sort(function(a,b){
                return a.year-b.year;
              });
          })//add missing with 0
          return nbFlows.sort(function(a,b){ return d3.ascending(a.key,b.key)})
        }
        var margin = {top: 20, right: 10, bottom: 20, left: 20 },
            width = document.querySelector('#number-flows-container').offsetWidth-margin.left-margin.right,
            height=100,
            offsetHeight=10;

        var minDate,maxDate;
       
        var stack = d3.layout.stack()
                      .values(function(d) { return d.values; })
                      .x(function(d) { return x(new Date(+d.year,0,1)); })
                      .y(function(d) { return d.nb_flows; })
                  
        var x = d3.time.scale()
                  .range([0, width])

        var y = d3.scale.linear()
                  .range([height, 0])


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10)

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("right")
                      .ticks(2)
                      .tickSize(width)
                      // .tickFormat(function(d,i){
                      //   if(i == 0){
                      //     return
                      //   }
                      //   else return valueFormat(d);
                      // })


        function customAxis(g) {
          g.selectAll("text")
            .attr("text-anchor","start")
            .attr("x",4)
            .attr("dy", -4)
            .attr("font-size", "0.85em");
          g.selectAll("line")
           .style("stroke","grey")
        }

        // var tooltip = d3.select("body")
        //               .append("div")
        //               .attr("class", "synth-tooltip")
        //               .style("width", "160px")

        var svg = d3.select("#number-flows-container").append("svg")
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("width",width + margin.left + margin.right)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        function draw(data) {
          var layers=stack(data)
          var barwidth=Math.floor(width/(maxDate-minDate))
          var maxReporting=d3.max(layers, function(d) {
            return d3.max(d.values,function(v){
              return v.y0+v.y
            })
          });

          x.domain([new Date(minDate,0,1), new Date(maxDate,0,1)]);
          y.domain([0,maxReporting])

          var indexIter=d3.range(0,154).map(function(d){return d*0;});
          var indexIterH=d3.range(0,154).map(function(d){return d*0;});

          var layer = svg.selectAll(".layer")
              .data(layers)
              .enter().append("g")
              .attr("class", "layer")
              .style("fill",function(d){return color(d.key)})

          // layer.selectAll("rect")
          //     .data(function(d) { return d.values; })
          //     .enter().append("rect")
          //     .attr("x", function(d) {return x(new Date(d.year,0,1))-barwidth/2; })
          //     .attr("y", function(d) { return y(d.y + d.y0); })
          //     .attr("height", function(d) { return y(d.y0) - y(d.y + d.y0); })
          //     .attr("width", barwidth- 1);

          layer.each(function(data,index){
            var e=d3.select(this)
            e.selectAll("rect")
              .data(data.values)
              .enter().append("rect")
              .attr("x", function(d) {return x(new Date(d.year,0,1))-barwidth/2; })
              .attr("y", function(d,i) { 
                // return y(d.y + d.y0)
                if(index!==0 && layers[index-1].values[i].y===0) indexIter[i]+=1;
                if(d.y>0 && (y(d.y0) - y(d.y + d.y0))<2) indexIterH[i]+= 2-(y(d.y0) - y(d.y + d.y0));
                return y(d.y + d.y0)-2*(index-indexIter[i]) - indexIterH[i];
              })
              .attr("height", function(d) {
                if((y(d.y0) - y(d.y + d.y0))===0) return y(d.y0) - y(d.y + d.y0);
                else return d3.max([y(d.y0) - y(d.y + d.y0),2]);
               // return y(d.y0) - y(d.y + d.y0) 
              })
              .attr("width", barwidth-1)
              .style("opacity",0.7)
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
      }//end of directive link function
    }//end of directive return function
  }])