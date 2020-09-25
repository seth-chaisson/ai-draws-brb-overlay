var download = require("download-file");
const modelNames = require("./modelNames");

modelNames.forEach((element) => {
  var url = `https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/${element}.gen.json`;
  var options = {
    directory: `./`,
    filename: `${element}.json`,
  };

  download(url, options, (e) => {
    console.log(e);
  });
});
