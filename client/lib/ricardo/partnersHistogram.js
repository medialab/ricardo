(function(){

  var ricardo = window.ricardo || (window.ricardo = {});

  ricardo.partnersHistogram = function(){
    var height = 600,
        width = document.querySelector('#partners-histogram-container').offsetWidth,
        //chartWidth = 370,
        marginTop = 15,
        marginLeft = 0,
        marginRight = 0,
        duration = 1000,
        yearWidth = 4,
        barWidth = 4,
        barMinHeigth = 2,
        barMaxHeigth = 30,
        barGap = 40,
        barColors = ["#663333", "#cc6666"],
        RICentities,
        order = "tot",
        filter = "all",
        continents = false,
        currency = "sterling pound"
        sum = 0;

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
      //console.log("leaves", leaves);
      var res = {
        exp: d3.sum(leaves, function(d){
          //console.log("rollupYears", d);
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
      //console.log("res", res);
      return res;
    }

    function partnersHistogram(selection){
      //console.log('selection', selection)
      selection.each(function(data){
        //console.log('data', data)
        //console.log('filter', filter)

        var indexYears = {};
        d3.nest()
          .key(function(d){ return d.year })
          .rollup(rollupYears)
          .entries(data)
          .forEach(function(y){
            indexYears[y.key] = y.values;
          })

        // We get rid of World partners
        data=data.filter(function(p){return !/^World/.test(p.partner_id)})
        // uncomment these two lines to use a filter and calcul on all data
        if (filter !== "all")
          data=data.filter(function(p){return p.type === filter})


        //console.log("data selected", data);
        var partners = d3.nest()  
          .key(function(d){ return d[continents ? "continent" : "partner_id"] })
          .key(function(d){ return d.year })
          .rollup(rollupYears)
          .entries(data)

        partners.forEach(function(p){
          p.years = []
          p.values.forEach(function(d){
            //console.log("d.key", d.key);
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
          //console.log("p.avg_tot", p.avg_tot);
          p.avg_imp = d3.mean(p.years, function(d){ return d.pct_imp });
          p.avg_exp = d3.mean(p.years, function(d){ return d.pct_exp });
        })

        partners.sort(function(a,b){
          if (order === 'name') 
            return d3.ascending(a.key, b.key);
          else return d3.descending(a["avg_" + order], b["avg_" + order]);
        });

        height = (partners.length + 1) * (barMaxHeigth + barGap);

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
            limits = d3.extent(years),
            maxWidth = yearWidth * (limits[1]-limits[0]+1);
            //years.pop();


          var x = d3.scale.linear()
              .domain(d3.extent(years))
              .range([0, width]), // witdh replace max width 
              y = d3.scale.linear()
              .range([0, barMaxHeigth/2]);

        partners.forEach(function(p, i){

          var entity = RICentities[""+p.key],
            name = (entity ? entity.RICname : p.key);

          y0 = marginTop + 30 + i * (barMaxHeigth + barGap);

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

          histo.selectAll(".bar")
            .data(p.years)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d){ return x(d.key) + (yearWidth - barWidth)/2 })
            .attr("y", function(d){ return (d.balance >= 0 ? -y(Math.abs(d.balance)) : 0);})
            .attr("width", barWidth)
            .attr("height", function(d) { return (d.balance ? Math.max(barMinHeigth, y(Math.abs(d.balance))) : 0); })
            .attr("fill", function(d){ return barColors[+(d.balance >=0)] })
            .attr("opacity", function(d){ return (d.imp !== null && d.exp !== null ? 1 : 0.3) });

          histo.selectAll(".tooltipBar")
            .data(p.years)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d){ return x(d.key) })
            .attr("y", -barMaxHeigth/2 )
            .attr("width", yearWidth)
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
            .on('mouseenter', this.onmouseover)
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
            .attr("y", -25)
            .attr("font-size", "0.8em")
            .text(function(d){ return name })

            if (order !== "name") {
             
              var rBigCircle = 12;
              histo.append("circle")
                .attr("cx", 25)
                .attr("cy", -30)
                .attr("r", rBigCircle)
                .style("stroke", "#777") 
                .style("fill", "transparent")
                .on('mouseover', function(d) {
                return tooltipCircle.html(
                  "<p>Total : " + formatPercent(p["avg_" + order]) + "</p>"
                  ).transition().style("opacity", .9);
                })
                .on('mouseenter', this.onmouseover)
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
                .attr("cy", -30)
                .attr("r", rLittleCircle)
                .style("stroke", "#333")  
                .style("fill", "#333")   
                
            }
        });
      });

    }


    partnersHistogram.height = function(x){
      if (!arguments.length) return height;
      height = x;
      return partnersHistogram;
    }

    partnersHistogram.width = function(x){
      if (!arguments.length) return width;
      width = x;
      //chartWidth = width - marginLeft - marginRight;
      yearWidth = width / 152;
      barWidth = 4 / 5 * yearWidth;
      return partnersHistogram;
    }

    partnersHistogram.RICentities = function(x){
      if (!arguments.length) return RICentities;
      RICentities = x;  
      return partnersHistogram;
    }

    partnersHistogram.barColors = function(x){
      if (!arguments.length) return barColors;
      barColors = x;
      return partnersHistogram;
    }
  
    partnersHistogram.order = function(x){
      if (!arguments.length) return order;
      order = x;
      return partnersHistogram;
    }

    partnersHistogram.filter = function(x){
      if (!arguments.length) return filter;
      filter = x;
      return partnersHistogram;
    }

    partnersHistogram.continents = function(x){
      if (!arguments.length) return continents;
      continents = x;
      return partnersHistogram;
    }

    partnersHistogram.duration = function(x){
      if (!arguments.length) return duration;
      duration = x;
      return partnersHistogram;
    }
  
    return partnersHistogram;
  }

})();

