const https = require("https");
const fs = require("fs");

const baseurl = "https://raw.githubusercontent.com/medialab/GeoPolHist/master/data";
const files = ["GeoPolHist_entities.csv", "GeoPolHist_entities_status_in_time.csv", "GeoPolHist_status.csv"];

files.forEach((filename) => {
  const newfile = `./src/public/csv/${filename}`;
  if (!fs.existsSync(newfile)) {
    const file = fs.createWriteStream(newfile);

    console.log(`Download file ${filename}`);
    const request = https
      .get(`${baseurl}/${filename}`, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
        });
      })
      .on("error", (err) => {
        fs.unlink(newfile);
        console.log(err);
      });
  }
});
