const https = require("https");
const fs = require("fs");

const baseurl = "https://raw.githubusercontent.com/medialab/GeoPolHist/master/data";
const files = ["GeoPolHist_entities.csv", "GeoPolHist_entities_status_over_time.csv", "GeoPolHist_status.csv"];

files.forEach((filename) => {
  const newfile = `./src/public/csv/${filename}`;
  //if (!fs.existsSync(newfile)) {
  const file = fs.createWriteStream(newfile);
  const url = `${baseurl}/${filename}`;
  console.log(`Download file ${filename} from ${url}`);
  const request = https
    .get(url, (response) => {
      if (response.statusCode !== 200) throw new Error(`HTTP error code ${response.statusCode} for ${url}`);
      response.pipe(file);
      file.on("finish", () => {
        file.close();
      });
    })
    .on("error", (err) => {
      fs.unlink(newfile);
      console.log(err);
    });
  // }
});
