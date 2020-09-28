const sqlite3 = require("sqlite3");
const conf = require("./configuration.json");
const { DirectedGraph } = require("graphology");
const { density } = require("graphology-metrics");
const { modularity } = require("graphology-metrics");
const pagerank = require("graphology-pagerank");
const louvain = require("graphology-communities-louvain");
const gexf = require("graphology-gexf/node");
const async = require("async");
const fs = require("fs");
const GTAP = require("./GTAP.js");
const layout = require("net-to-img/layout");

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

const computeGraph = (args, done) => {
  const { year, geoloc_RICentities } = args;
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
  // }exports

  DB.get().all(
    `SELECT * FROM ${conf.flow_table}
    WHERE
      flow is not null and rate is not null AND
      year = ${year} AND
      (partner is not null AND (partner not LIKE 'world%' OR partner = 'World_best_guess'))
      `,
    function (err, rows) {
      if (err) done(err);
      const graph = new DirectedGraph();
      const totalTrade = { Imp: 0, Exp: 0 };
      const nbMirrorFlows = {
        by_source_type: {},
        by_reporting_type: {},
        by_partner_type: {},
      };

      rows.forEach((r) => {
        const w = (r.flow * (r.unit || 1)) / r.rate;
        if (w && w != 0) {
          if (r.partner_slug === "Worldbestguess") {
            // store total flows as nodes params
            const p = {
              type: r.reporting_type,
              label: r.reporting,
              continent: r.reporting_continent,
            };
            p[`world_${r.expimp}`] = w;
            totalTrade[r.expimp] += w;
            graph.mergeNode(r.reporting_slug, p);
          } else {
            graph.mergeNode(r.reporting_slug, {
              type: r.reporting_type,
              label: r.reporting,
              continent: r.reporting_continent,
              reporting: 1,
            });
            if (r.reporting_GPH_code)
              graph.setNodeAttribute(
                r.reporting_slug,
                "GPH_code",
                r.reporting_GPH_code
              );
            graph.mergeNode(r.partner_slug, {
              type: r.partner_type,
              label: r.partner,
              continent: r.partner_continent,
            });

            if (r.partner_GPH_code)
              graph.setNodeAttribute(
                r.partner_slug,
                "GPH_code",
                r.partner_GPH_code
              );
            let source = r.reporting_slug;
            let target = r.partner_slug;
            // swap
            if (r.expimp === "Imp") {
              [source, target] = [target, source];
              weightLabel = "targetWeight";
            } else weightLabel = "sourceWeight";
            try {
              const edgeData = {
                sourceWeight: w,
                direction: r.expimp,
                source_type: r.type,
              };
              edgeData[weightLabel] = w;
              graph.addEdge(source, target, edgeData);
            } catch (error) {
              // duplicated edge
              const dup_edge = graph.edge(source, target);
              // add mirror info

              graph.setEdgeAttribute(
                dup_edge,
                r.expimp === "Imp" ? "targetWeight" : "sourceWeight",
                w
              );

              const dup_source_type = graph.getEdgeAttribute(
                dup_edge,
                "source_type"
              );
              // add info that this edge is mirrored
              graph.setEdgeAttribute(dup_edge, "mirrored", true);
              // storing extra meta for mirroflows for later stats analysis
              graph.setEdgeAttribute(
                dup_edge,
                "source_types",
                [r.type, dup_source_type].sort()
              );
              graph.setEdgeAttribute(
                dup_edge,
                "reporting_types",
                [
                  r.reporting_type,
                  graph.getNodeAttribute(
                    r.expimp === "Imp" ? source : target,
                    "type"
                  ),
                ].sort()
              );
              graph.setEdgeAttribute(
                dup_edge,
                "partner_types",
                [
                  r.partner_type,
                  graph.getNodeAttribute(
                    r.expimp === "Imp" ? target : source,
                    "type"
                  ),
                ].sort()
              );

              //rules to choose which information to keep
              if (
                // dup edege is from aggregation but the new is not, let's merge to give priority to source
                (dup_source_type === "aggregation" &&
                  r.source_type !== "aggregation") ||
                // mirror flows from sources, we prefer Exp on Imp in such cases
                (r.expimp === "Exp" &&
                  dup_source_type !== "aggregation" &&
                  r.source_type !== "aggregation") ||
                // same rule of mirror flows if both edges are from aggregations
                (r.expimp === "Exp" &&
                  dup_source_type === "aggregation" &&
                  r.source_type === "aggregation")
              ) {
                graph.mergeEdge(source, target, {
                  weight: w,
                  direction: r.expimp,
                  source_type: r.type,
                });
              }
            }
          }
        }
      });
      //prepare output metrics container
      const metrics = {
        entities: {},
        networks: { density: {}, order: {}, size: {} },
      };
      // compute metrics
      metrics.year = year;
      // network level
      metrics.networks.density = density(graph);
      metrics.networks.nb_reportings = graph.order;
      metrics.networks.nb_flows = graph.size;
      // Modularity score of Louvain partition
      louvain.assign(graph);
      metrics.networks.modularity = modularity(graph);

      //node level
      pagerank.assign(graph);
      graph.nodes().forEach((n) => {
        const reportingType = graph.getNodeAttribute(n, "type");
        metrics.networks[`nb_entities_${reportingType}`] =
          (metrics.networks[`nb_entities_${reportingType}`] || 0) + 1;
        if (graph.getNodeAttribute(n, "reporting"))
          metrics.networks[`nb_reportings_${reportingType}`] =
            (metrics.networks[`nb_reportings_${reportingType}`] || 0) + 1;
        else
          metrics.networks[`nb_partners_${reportingType}`] =
            (metrics.networks[`nb_partners_${reportingType}`] || 0) + 1;

        const { RIX, inDegree } = GTAP.RIX(n, graph);
        graph.setNodeAttribute(n, "RIX", RIX);
        // herfindall index
        //const inDegree = graph.inEdges(n).reduce((acc,e) => acc + graph.getEdgeAttribute(e,'weight'), 0);
        const outDegree = graph
          .outEdges(n)
          .reduce((acc, e) => acc + graph.getEdgeAttribute(e, "weight"), 0);
        graph.setNodeAttribute(
          n,
          "inHerfindahl",
          graph
            .inEdges(n)
            .reduce(
              (acc, e) =>
                acc +
                Math.pow(graph.getEdgeAttribute(e, "weight") / inDegree, 2),
              0
            )
        );
        graph.setNodeAttribute(
          n,
          "outHerfindahl",
          graph
            .outEdges(n)
            .reduce(
              (acc, e) =>
                acc +
                Math.pow(graph.getEdgeAttribute(e, "weight") / outDegree, 2),
              0
            )
        );
        graph.setNodeAttribute(
          n,
          "herfindahl",
          graph.neighbors(n).reduce((acc, neighbor) => {
            // total trade of this neighbor
            let neighborTotal = graph
              .edges(n, neighbor)
              .reduce((s, e) => s + graph.getEdgeAttribute(e, "weight"), 0);
            return acc + Math.pow(neighborTotal / (inDegree + outDegree), 2);
          }, 0)
        );
        graph.setNodeAttribute(n, "weightedInDegree", inDegree);
        graph.setNodeAttribute(n, "weightedOutDegree", outDegree);
        graph.setNodeAttribute(n, "inDegree", graph.inDegree(n));
        graph.setNodeAttribute(n, "outDegree", graph.outDegree(n));

        // store node attributes to metrics
        metrics.entities[n] = graph.getNodeAttributes(n);

        if (metrics.entities[n].world_Exp && metrics.entities[n].world_Imp) {
          metrics.entities[n].worldTradePart =
            (metrics.entities[n].world_Imp + metrics.entities[n].world_Exp) /
            (totalTrade.Exp + totalTrade.Imp);
          graph.setNodeAttribute(
            n,
            "worldTradePart",
            metrics.entities[n].worldTradePart
          );
        }
      });

      // now that we loop on all nodes we can chose the right miror using GTAP data
      // number of mirror Flows as defined by flows between reportings
      metrics.networks.mirrorFlows = graph.edges().reduce((acc, e) => {
        //if (graph.extremities(e).map(n => !!graph.getNodeAttribute(n, 'reporting')).filter(_ => _).length === 2)
        if (graph.getEdgeAttribute(e, "mirrored")) {
          let st = graph.getEdgeAttribute(e, "source_types");
          let rt = graph.getEdgeAttribute(e, "reporting_types");
          let pt = graph.getEdgeAttribute(e, "partner_types");
          nbMirrorFlows["by_source_type"][st] =
            nbMirrorFlows["by_source_type"][st] + 1 || 1;
          nbMirrorFlows["by_reporting_type"][rt] =
            nbMirrorFlows["by_reporting_type"][rt] + 1 || 1;
          nbMirrorFlows["by_partner_type"][pt] =
            nbMirrorFlows["by_partner_type"][pt] + 1 || 1;
          // chose a weight for edge using GTAP index
          const sourceRIX = graph.getNodeAttribute(graph.source(e), "RIX");
          const targetRIX = graph.getNodeAttribute(graph.target(e), "RIX");
          if (sourceRIX >= targetRIX)
            graph.setEdgeAttribute(
              e,
              "weight",
              graph.getEdgeAttribute(e, "sourceWeight")
            );
          else
            graph.setEdgeAttribute(
              e,
              "weight",
              graph.getEdgeAttribute(e, "targetWeight")
            );
          return acc + 1;
        } else {
          graph.setEdgeAttribute(
            e,
            "weight",
            graph.getEdgeAttribute(e, "sourceWeight") ||
              graph.getEdgeAttribute(e, "targetWeight")
          );
          return acc;
        }
      }, 0);
      metrics.nbMirrorFlows = nbMirrorFlows;
      if ((year >= 1834 && year <= 1913) || (year >= 1924 && year <= 1939)) {
        const periode = (y) => {
          if (y <= 1860) return "1834-1860-pré-première-période";
          if (y <= 1913) return "1861-1913-première-mondialisation";
          return "1924-1939-désintégration";
        };

        let sageocsv = "";
        graph.forEach(
          (
            source,
            target,
            sourceAttributes,
            targetAttributes,
            edge,
            edgeAttributes
          ) => {
            if (
              geoloc_RICentities.hasOwnProperty(source) &&
              geoloc_RICentities.hasOwnProperty(target)
            )
              sageocsv += `"${source}","${target}",${graph.getEdgeAttribute(
                edge,
                "weight"
              )},${year},${periode(year)}\n`;
          }
        );
        metrics.sageocsv = sageocsv;
      }

      //Write gexf
      if (conf.writeGexf) {
        const spacializedGraph = layout(graph, {
          groupByAttributeKey: "continent",
        });
        fs.writeFileSync(
          `./data/networks/${year}.gexf`,
          gexf.write(spacializedGraph),
          "utf8"
        );
        console.log(`wrote ./data/networks/${year}.gexf`);
      }
      done(null, metrics);
    }
  );
};

async.waterfall([
  (cb) => {
    // load RICentities geoloc
    DB.get().all("SELECT * FROM RICentities", function (err, rows) {
      // create a filter on geoloc-ed RICentities
      geoloc_RICentities = {};
      rows.forEach((r) => {
        if (r.lat && r.lat != "") {
          geoloc_RICentities[r["slug"]] = r;
        }
      });
      cb(null, geoloc_RICentities);
    });
  },
  (geoloc_RICentities, cb) => {
    // prepare list of years to compute from cnnfig
    const years = [];
    for (year = conf.startDate; year <= conf.endDate; year++) {
      years.push({ year, geoloc_RICentities });
    }
    // throw computation in async mode
    async.map(years, computeGraph, (err, metrics) => {
      //merge metrics
      const gapMinderMetrics = [];
      const networksMetrics = [];
      const metricsByYear = {
        networks: {
          density: {},
          nb_reportings: {},
          nb_flows: {},
          modularity: {},
        },
        entities: {},
      };
      const general_stat = {};
      const nbMirrorFlows = {
        by_source_type: {},
        by_reporting_type: {},
        by_partner_type: {},
      };
      let sageocsv = `idorigine,iddestination,volume,annee,periode\n`;
      metrics.forEach((m) => {
        if (m.sageocsv) sageocsv += m.sageocsv;
        // aggregating nbMirrorFlows
        for (by in m.nbMirrorFlows) {
          for (p in m.nbMirrorFlows[by]) {
            nbMirrorFlows[by][p] =
              (nbMirrorFlows[by][p] || 0) + m.nbMirrorFlows[by][p];
          }
        }
        general_stat["nbMirrorFlows"] = nbMirrorFlows;

        // to be factorized later
        metricsByYear.networks.density[m.year] = m.networks.density;
        metricsByYear.networks.modularity[m.year] = m.networks.modularity;
        metricsByYear.networks.nb_reportings[m.year] = m.networks.nb_reportings;
        metricsByYear.networks.nb_flows[m.year] = m.networks.nb_flows;
        // networks metrics only
        networksMetric = { year: m.year };
        for (a in m.networks) networksMetric[a] = m.networks[a];
        networksMetrics.push(networksMetric);

        for (e in m.entities) {
          // gapminder viz data formatting
          // check if entity is a reporting (i.e. has world trade reports)
          gapMinderMetrics.push({
            year: m.year,
            entity: m.entities[e].label,
            type: m.entities[e].type,
            isReporting: m.entities[e].reporting || false,
            continent: m.entities[e].continent,
            pagerank: m.entities[e].pagerank,
            worldTrade:
              m.entities[e].world_Imp || 0 + m.entities[e].world_Exp || 0,
            worldTradePart: m.entities[e].worldTradePart || null,
            herfindahl: m.entities[e].herfindahl,
            inHerfindahl: m.entities[e].inHerfindahl,
            outHerfindahl: m.entities[e].outHerfindahl,
            inDegree: m.entities[e].inDegree,
            outDegree: m.entities[e].outDegree,
            weightedInDegree: m.entities[e].weightedInDegree,
            weightedOutDegree: m.entities[e].weightedOutDegree,
            RIX: m.entities[e].RIX,
          });

          // generic output
          if (!metricsByYear.entities[e]) metricsByYear.entities[e] = {};

          for (p in m.entities[e]) {
            if (!metricsByYear.entities[e][p])
              metricsByYear.entities[e][p] = {};
            if (["type", "label", "continent"].indexOf(p) !== -1)
              metricsByYear.entities[e][p] = m.entities[e][p];
            else metricsByYear.entities[e][p][m.year] = m.entities[e][p];
          }
        }
      });

      const output_filename = `metrics_${conf.startDate}_${conf.endDate}.json`;

      fs.writeFile(
        `./data/${output_filename}`,
        JSON.stringify(metricsByYear, null, 2),
        "utf8",
        (err) => {
          if (err) console.log(`error : couldn't write ${output_filename}`);
          else console.log(`writing to ${output_filename}`);
        }
      );
      fs.writeFile(
        `./data/${conf.gapMinder_metric_filename}`,
        JSON.stringify(gapMinderMetrics, null, 2),
        "utf8",
        (err) => {
          if (err)
            console.log(
              `error : couldn't write ${conf.gapMinder_metric_filename}`
            );
          else console.log(`writing to ${conf.gapMinder_metric_filename}`);
        }
      );
      fs.writeFile(
        `./data/${conf.network_metric_filename}`,
        JSON.stringify(networksMetrics, null, 2),
        "utf8",
        (err) => {
          if (err)
            console.log(
              `error : couldn't write ${conf.network_metric_filename}`
            );
          else console.log(`writing to ${conf.network_metric_filename}`);
        }
      );
      fs.writeFile(
        `./data/${conf.general_stat_filename}`,
        JSON.stringify(general_stat, null, 2),
        "utf8",
        (err) => {
          if (err)
            console.log(`error : couldn't write ${conf.general_stat_filename}`);
          else console.log(`writing to ${conf.general_stat_filename}`);
        }
      );
      fs.writeFile(
        `./data/SAGEO_RICardo_edges.csv`,
        sageocsv,
        "utf8",
        (err) => {
          if (err) console.log(`error : couldn't write SAGEOCSV ${err}`);
          else console.log(`writing to SAGEOCSVS`);
        }
      );
    });
  },
  () => {
    DB.get().close();
  },
]);
