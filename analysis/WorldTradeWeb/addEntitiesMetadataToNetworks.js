const fs = require("fs");
const async = require("async");
const sqlite3 = require("sqlite3");
const { keyBy, range } = require("lodash");
const papaparse = require("papaparse");
const { DirectedGraph } = require("graphology");
const gexf = require("graphology-gexf");
const conf = require("./configuration.json");

const NETWORK_DIR = "./data/networks";

const addEntitiesMetadataToNetwork = (props, done) => {
  console.log(`updating ${props.year}`);
  const { year, networkFilename, entitiesInFedericoTena, GPHStatus } = props;
  const gexfString = fs.readFileSync(`${NETWORK_DIR}/${networkFilename}`, {
    encoding: "utf8",
  });
  const graph = gexf.parse(DirectedGraph, gexfString);
  graph.forEachNode((node, atts) => {
    // FT
    graph.setNodeAttribute(
      node,
      "inFedericoTenaSeries",
      entitiesInFedericoTena.includes(atts.label)
    );
    // GPH
    graph.setNodeAttribute(node, "GPHStatus", GPHStatus[atts.GPH_code] || null);
  });
  fs.writeFileSync(`${NETWORK_DIR}/${networkFilename}`, gexf.write(graph), {
    encoding: "utf8",
  });
  console.log(`updated ${networkFilename}`);
  done(null, year);
};

const database = new sqlite3.Database(`./data/${conf.RICardo_data}`);
// get FedericoTena index
database.all(
  `SELECT year, group_concat(reporting, ';|;') as reportings
  FROM (SELECT year, reporting from flow_aggregated WHERE partner = "World Federico Tena" group by year, reporting)
  GROUP BY year;`,
  (err, rows) => {
    const entitiesInFedericoTenaByYear = keyBy(
      rows.map((r) => ({
        year: r.year,
        reportings: r.reportings.split(";|;"),
      })),
      (r) => r.year
    );

    papaparse.parse(
      fs.createReadStream(
        "../../../GeoPolHist/data/aggregated/GeoPolHist_entities_in_time.csv"
      ),
      {
        header: true,
        complete: (GPH_data) => {
          //build index
          // {year : {GPH_code:status}}
          const GPHStatusByYear = {};
          GPH_data.data.forEach((d) => {
            range(1816, 2020).map((y) => {
              if (d[+y] !== "") {
                const index = GPHStatusByYear[+y] || {};
                index[d.COW_id] = d[+y].split(" | ")[0];
                GPHStatusByYear[+y] = index;
              }
            });
          });
          console.log(NETWORK_DIR);
          // list all files in the directory
          const files = fs.readdirSync(NETWORK_DIR);
          const networkProps = files
            .filter((f) => f.includes(".gexf"))
            .map((f) => {
              // network filename are {year}.gexf
              const year = f.split(".")[0];
              return {
                year,
                networkFilename: f,
                entitiesInFedericoTena:
                  entitiesInFedericoTenaByYear[year].reportings,
                GPHStatus: GPHStatusByYear[year],
              };
            });
          console.log(networkProps.map((y) => y.year));
          async.map(
            networkProps,
            addEntitiesMetadataToNetwork,
            (err, stats) => {
              if (err) console.log(err);
              console.log("finished");
            }
          );
        },
      }
    );
  }
);
