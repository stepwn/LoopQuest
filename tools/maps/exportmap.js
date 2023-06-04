var util = require('util');
var fs = require('fs');
var processMap = require('./processmap');

var source = process.argv[2];
var destination = process.argv[3];
var mode = process.argv[4];

if (!source || !destination) {
  util.puts('Usage: ./exportmap.js map_file json_file [mode]');
  util.puts('Optional parameter: mode. Values: "server" (default) or "client".');
  process.exit(0);
}

function main() {
  getTiledJSONmap(source, function (json) {
    var options = { mode: mode || 'server' };
    var map = processMap(json, options);

    var jsonMap = JSON.stringify(map); // Save the processed map object as JSON data

    if (mode === 'client') {
      // map in a .json file for ajax loading
      fs.writeFile(destination + '.json', jsonMap, function (err) {
        if (err) {
          console.error('Error saving .json file:', err);
          return;
        }
        console.log('Finished processing map file: ' + destination + '.json was saved.');
      });

      // map in a .js file for web worker loading
      jsonMap = 'var mapData = ' + JSON.stringify(map);
      fs.writeFile(destination + '.js', jsonMap, function (err) {
        if (err) {
          console.error('Error saving .js file:', err);
          return;
        }
        console.log('Finished processing map file: ' + destination + '.js was saved.');
      });
    } else {
      fs.writeFile(destination, jsonMap, function (err) {
        if (err) {
          console.error('Error saving file:', err);
          return;
        }
        console.log('Finished processing map file: ' + destination + ' was saved.');
      });
    }
  });
}

// Loads the temporary JSON Tiled map converted by tmx2json.py
function getTiledJSONmap(filename, callback) {
  if (!fs.existsSync(filename)) {
    console.log(filename + ' doesn\'t exist.');
    return;
  }

  fs.readFile(filename, function (err, file) {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    callback(JSON.parse(file.toString()));
  });
}

main();
