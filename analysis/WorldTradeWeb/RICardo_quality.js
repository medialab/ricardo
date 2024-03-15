const sqlite3 = require("sqlite3");
const conf = require("./configuration.json");
const {keyBy, range, uniq, keys, flatten} = require('lodash');
const { MultiDirectedGraph } = require("graphology");

const async = require("async");
const fs = require("fs");

// GeoPolHist
const GPH_DATA_PATH = "./data/GeoPolHist/GeoPolHist_entities_extended.json";
const GPH_Data = require(GPH_DATA_PATH);

function GPH_status(GPH_code, year) {
  if (
    GPH_Data &&
    GPH_Data[GPH_code] &&
    GPH_Data[GPH_code].years &&
    year in GPH_Data[GPH_code].years
  ) {
    return {
      status: GPH_Data[GPH_code].years[year][0].status,
      sovereign: GPH_Data[GPH_code].years[year][0].sovereign
        ? GPH_Data[GPH_Data[GPH_code].years[year][0].sovereign].name
        : GPH_Data[GPH_code].name,
    };
  }
  return null;
}

// RICardo database acces as singleton
const DB = (() => {
  var _db = null;
  return new (function () {
    this.get = () => {
      if (_db == null) {
        _db = new sqlite3.Database(`./data/${conf.RICardo_data}`);
      }
      return _db;
    };
  })();
})();

const computeGraph = (year, done) => {
  DB.get().all(
    `SELECT * FROM flow_aggregated
    WHERE
      flow is not null and rate is not null AND
      year = ${year} AND
      (partner is not null AND (partner not LIKE 'world%' OR partner IN ('World_best_guess', 'World Federico Tena')))
      `,
    function (err, rows) {
      console.log(year)
      if (err) done(err);
      const graph = new MultiDirectedGraph();
      //const totalTrade = { Imp: 0, Exp: 0 };
      const nbMirrorFlows = {
        by_source_type: {},
        by_reporting_type: {},
        by_partner_type: {},
      };

      //build bilateral trade network
      rows.forEach((r) => {
        const w = (r.flow * (r.unit || 1)) / r.rate;
        if (w && w != 0) {
          if (["WorldFedericoTena", "Worldbestguess"].includes(r.partner_slug)) {
            // store total flows as nodes params
            const p = {
              type: r.reporting_type,
              label: r.reporting,
              continent: r.reporting_continent,
            };
            p[`${r.partner_slug}_${r.expimp}`] = w;
            
            graph.mergeNode(r.reporting_slug, p);
          } else {
            const reporting_GPH_status = GPH_status(
              r.reporting_GPH_code,
              "" + year
            );
            graph.mergeNode(r.reporting_slug, {
              type: r.reporting_type,
              label: r.reporting,
              GPH_status: reporting_GPH_status?.status || r.reporting_type,
              part_of:
                r.reporting_part_of_GPH_entity ||
                reporting_GPH_status?.sovereign,
              continent: r.reporting_continent,
              reporting: 1,
            });
            const partner_GPH_status = GPH_status(
              r.partner_GPH_code,
              "" + year
            );
            graph.mergeNode(r.partner_slug, {
              type: r.partner_type,
              label: r.partner,
              GPH_status: partner_GPH_status?.status || r.partner_type,
              part_of:
                r.partner_part_of_GPH_entity || partner_GPH_status?.sovereign,
              GPH_status: partner_GPH_status?.status || r.partner_type,
              continent: r.partner_continent,
            });
            let source = r.reporting_slug;
            let target = r.partner_slug;
            // swap
            if (r.expimp === "Imp") {
              [source, target] = [target, source];
            }
              const edgeData = {   
                weight:w,
                direction: r.expimp,
                source_type: r.type,
              };
              graph.addEdge(source, target, edgeData);
          }
        }
      });

      // analysis

      // count flows to "dead hands"
      // dead hands are trade partners who are not reporters the same year
      // imperfections which breaks the ideal squared trade matrix

      let nbFlowsIntraReportings = 0
      let valueFlowsIntraReporting = 0
      let nbFlowsDeadHands = 0
      let valueFlowsDeadHands = 0
      const deadHandsTypes = { groups: 0, informal: 0, others: 0}
      graph.forEachEdge((e, eAtts,src,srcAtts,trg,trgAtts)=> {
        if(eAtts.direction === "Exp"){
        if(trgAtts.reporting === 1){
            // bilateral flow between two reportings
            nbFlowsIntraReportings += 1
            valueFlowsIntraReporting += eAtts.weight
        }
        else {
            nbFlowsDeadHands += 1
            if (trgAtts.type === "group") deadHandsTypes.groups += 1
            else if (trgAtts.GPH_status === "informal") deadHandsTypes.informal += 1
            else deadHandsTypes.others += 1

            valueFlowsDeadHands += eAtts.weight
        }}
      })
      let worldTradeReportingBilateral = 0; 
      let worldTradeReporting = 0; 
      let worldTradeTena = 0;
      let nbReportings = 0
      let reportingRatio = {}
      graph.forEachNode((n, atts)=>{
        
        worldTradeTena += atts.WorldFedericoTena_Exp||0
        if(atts.reporting === 1){
          nbReportings += 1
          if(graph.degree(n) > 0){
            reportingRatio[`z_${n}`] = atts.Worldbestguess_Exp/atts.WorldFedericoTena_Exp
            worldTradeReportingBilateral += atts.Worldbestguess_Exp || 0}
          worldTradeReporting +=  atts.Worldbestguess_Exp || 0
      }})
      console.log(worldTradeReportingBilateral, worldTradeReporting, worldTradeTena )
      const data = {
        year,
        nbFlowsIntraReportings,
        nbFlowsDeadHands,
        ratioFlowsDeadsHands : nbFlowsDeadHands/(nbFlowsIntraReportings+nbFlowsDeadHands),
        valueFlowsIntraReporting,
        valueFlowsDeadHands,
        ratioValueDeadHands: valueFlowsDeadHands/(valueFlowsDeadHands+valueFlowsIntraReporting),
        ratioValueIntraOnBestGuestReportingBilateral: valueFlowsIntraReporting/worldTradeReportingBilateral,
        ratioValueBestGuessReportingBilateralOnBestGuess: worldTradeReportingBilateral/worldTradeReporting,
        ratioValueBestGuessReportingBilateralOnFedericoTena: worldTradeReportingBilateral/worldTradeTena,
        ...reportingRatio
      }
      done(null, data);
  })}


  // prepare list of years to compute from cnnfig
  const years = range(conf.startDate, conf.endDate)

  // throw computation in async mode
  async.map(years, computeGraph, (err, data) => {
    if(err) throw new Error(err.message)
    let csv = `variable,${years.join(',')}\n`;
    const variables = uniq(flatten(data.map(d => { return keys(d).filter(k => k !== 'year')})))
  
    const dataByYear = keyBy(data, d => d.year)
    variables.forEach(variable => {
      csv += `${variable},${years.map(y => dataByYear[y][variable]||'').join(',')}\n`
    })


    fs.writeFile(
      `./data/quality.csv`,
      csv,
      "utf8",
      (err) => {
        if (err) console.log(`error : couldn't write quality CSV ${err}`);
        else console.log(`writing to quality CSV`);
      }
    );
  })
  DB.get().close();