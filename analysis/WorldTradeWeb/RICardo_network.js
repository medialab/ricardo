const sqlite3 = require('sqlite3')
const conf = require('./configuration.json')
const {DirectedGraph} = require('graphology');
const {density} = require('graphology-metrics');
const {modularity} = require('graphology-metrics');
const pagerank = require('graphology-pagerank');
const louvain = require('graphology-communities-louvain');
const gexf = require('graphology-gexf/browser');
const async = require('async');
const fs = require('fs');

// RICardo database acces as singleton
const DB =  ( () => {
    var _db = null;
    return new function(){
        this.get = () => {
            if (_db == null){
                _db = new sqlite3.Database(`./data/${conf.RICardo_data}`);
            }
            return _db;
        }
    }
})();


const computeGraph = (year, done) =>{
  //Metrics output

  // {
  //   entities:{
  //     entitySlug:{
  //       label:"entity name",
  //       pagerank:value,
  //       ...
  //     }
  //   },
  //   network:{
  //     density:{year:value}...
  //   }
  // }


  DB.get().all(`SELECT * FROM flow_joined
    WHERE
      flow is not null and rate is not null AND
      year = ${year} AND
      (partner is not null AND (partner not LIKE 'world%' OR partner = 'World_best_guess'))
      `, 
    function(err, rows) {
      
      const graph = new DirectedGraph()
      const totalTrade = {'Imp':0, 'Exp':0}
      
      rows.forEach(r => {

        const w = r.flow*(r.unit || 1)/r.rate; 
        if (w && w != 0){

          if (r.partner_slug === "Worldbestguess"){
            
            // store total flows as nodes params
            const p = {type: r.reporting_type, label: r.reporting, continent: r.reporting_continent};
            p[`world_${r.expimp}`] = w;
            totalTrade[r.expimp] += w;
            graph.mergeNode(r.reporting_slug,p);
          }
          else{

            graph.mergeNode(r.reporting_slug,{type:r.reporting_type, label:r.reporting, continent: r.reporting_continent})
            graph.mergeNode(r.partner_slug,{type:r.reporting_type, label: r.partner, continent: r.partner_continent})
            let source = r.reporting_slug
            let target = r.partner_slug
            // swap 
            if (r.expimp === 'Imp')
              [source,target] = [target,source]
            
            try{
              graph.addEdge(source, target, {weight:w, direction:r.expimp});   
            }
            catch(error){
              // duplicated edge because of mirror flows, we prefer Exp on Imp in such cases
              if(r.expimp==='Exp')
                graph.mergeEdge(source, target, {weight:w, direction:r.expimp});
            }
          }
        }
          
      })
      //prepare output metrics container
      const metrics = {entities:{},networks:{density:{},order:{},size:{}}};
      // compute metrics
      metrics.year = year;
      // network level
      metrics.networks.density = density(graph);
      metrics.networks.nb_reportings = graph.order;
      metrics.networks.nb_flows = graph.size;
      // Modularity score of Louvain partition 
      louvain.assign(graph);
      metrics.networks.modularity = modularity(graph);
      

      // number of edges which replace partner missing flows by reporting sources
      // Those edges are 'Imp' one as we prefer 'Exp' when both data exists
      metrics.networks.mirrorFlows = graph.edges().reduce((acc,e) => {
        return graph.getEdgeAttribute(e, 'direction') === 'Imp' ? acc + 1 : acc 
      },0);


      //node level
      pagerank.assign(graph);
      graph.nodes().forEach(n => {
        const reportingType = graph.getNodeAttribute(n, 'type');
        metrics.networks[`nb_reportings_${reportingType}`] = (metrics.networks[`nb_reportings_${reportingType}`] || 0 ) + 1

        // herfindall index
        const inDegree = graph.inEdges(n).reduce((acc,e) => acc + graph.getEdgeAttribute(e,'weight'), 0);
        const outDegree = graph.outEdges(n).reduce((acc,e) => acc + graph.getEdgeAttribute(e,'weight'), 0);
        graph.setNodeAttribute(n, 'inHerfindahl', graph.inEdges(n).reduce((acc,e) => acc + Math.pow(graph.getEdgeAttribute(e,"weight")/inDegree,2), 0));
        graph.setNodeAttribute(n, 'outHerfindahl', graph.outEdges(n).reduce((acc,e) => acc + Math.pow(graph.getEdgeAttribute(e,"weight")/outDegree,2), 0));
        graph.setNodeAttribute(n, 'herfindahl', graph.neighbors(n).reduce((acc,neighbor) =>{
          // total trade of this neighbor 
          let neighborTotal = graph.edges(n,neighbor).reduce((s, e) => s+graph.getEdgeAttribute(e,'weight'), 0);
          return acc + Math.pow(neighborTotal/(inDegree+outDegree),2);
        },0));
        graph.setNodeAttribute(n, 'weightedInDegree', inDegree);
        graph.setNodeAttribute(n, 'weightedOutDegree', outDegree);
        graph.setNodeAttribute(n, 'inDegree', graph.inDegree(n));
        graph.setNodeAttribute(n, 'outDegree', graph.outDegree(n));
        
        // store node attributes to metrics
        metrics.entities[n] = graph.getNodeAttributes(n);
        
        if (metrics.entities[n].world_Exp && metrics.entities[n].world_Imp){
          metrics.entities[n].worldTradePart = (metrics.entities[n].world_Imp + metrics.entities[n].world_Exp) / (totalTrade.Exp + totalTrade.Imp);
          graph.setNodeAttribute(n,'worldTradePart', metrics.entities[n].worldTradePart);
        }
      })
      //Write gexf
      if (conf.writeGexf){
        const gexfString = gexf.write(graph);
        fs.writeFile(`./data/networks/${year}.gexf`, gexfString, 'utf8', (err) => {
          if (err)
            done(err);
          else{
            done(null, metrics);   
          }
        })
      }
      else
        done(null, metrics);
  });
}


// prepare list of years to compute from cn*onfig
const years = []
for (year = conf.startDate; year <= conf.endDate; year++) {
      years.push(year)
}
// throw computation in async mode
async.map(years, computeGraph, (err, metrics) =>{
   //merge metrics
   const gapMinderMetrics = []
   const networksMetrics =[]
   const metricsByYear = {networks:{density:{},nb_reportings:{},nb_flows:{},modularity:{}},entities:{}}
   metrics.forEach(m => {
      // to be factorized later
      metricsByYear.networks.density[m.year] = m.networks.density;
      metricsByYear.networks.modularity[m.year] = m.networks.modularity;
      metricsByYear.networks.nb_reportings[m.year] = m.networks.nb_reportings;
      metricsByYear.networks.nb_flows[m.year] = m.networks.nb_flows;
      // networks metrics only
      networksMetric = {year:m.year};
      for (a in m.networks)
        networksMetric[a] = m.networks[a];
      networksMetrics.push(networksMetric);

      
      for (e in m.entities){

        // gapminder viz data formatting
        // check if entity is a reporting (i.e. has world trade reports)
        gapMinderMetrics.push({
            year: m.year,
            reporting: m.entities[e].label,
            continent: m.entities[e].continent,
            pagerank: m.entities[e].pagerank,
            worldTrade: m.entities[e].world_Imp || 0 + m.entities[e].world_Exp || 0,
            worldTradePart: m.entities[e].worldTradePart || null,
            herfindahl: m.entities[e].herfindahl,
            inHerfindahl: m.entities[e].inHerfindahl,
            outHerfindahl: m.entities[e].outHerfindahl,
            inDegree: m.entities[e].inDegree,
            outDegree: m.entities[e].outDegree,
            weightedInDegree: m.entities[e].weightedInDegree,
            weightedOutDegree: m.entities[e].weightedOutDegree
        })  
        
        // generic output
        if(!metricsByYear.entities[e])
          metricsByYear.entities[e] = {}

        for (p in m.entities[e]){
          if(!metricsByYear.entities[e][p])
            metricsByYear.entities[e][p]={}
          if (['type','label','continent'].indexOf(p) !== -1)
            metricsByYear.entities[e][p] = m.entities[e][p]
          else
            metricsByYear.entities[e][p][m.year] = m.entities[e][p]
        }
      }
   })
   
   const output_filename = `metrics_${conf.startDate}_${conf.endDate}.json`
   
   fs.writeFile(`./data/${output_filename}`, JSON.stringify(metricsByYear,null, 2), 'utf8', (err)=>{
      if (err) console.log(`error : couldn't write ${output_filename}`);
      else console.log(`writing to ${output_filename}`);
    });
  fs.writeFile(`./data/${conf.gapMinder_metric_filename}`, JSON.stringify(gapMinderMetrics, null, 2), 'utf8', (err)=>{
      if (err) console.log(`error : couldn't write ${conf.gapMinder_metric_filename}`);
      else console.log(`writing to ${conf.gapMinder_metric_filename}`);
    });
  fs.writeFile(`./data/${conf.network_metric_filename}`, JSON.stringify(networksMetrics, null, 2), 'utf8', (err)=>{
      if (err) console.log(`error : couldn't write ${conf.network_metric_filename}`);
      else console.log(`writing to ${conf.network_metric_filename}`);
    });
})

DB.get().close();