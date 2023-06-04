#!/usr/bin/env node

const fs = require('fs');
const util = require('util');
const xml2js = require('xml2js');

const tmxFile = process.argv[2];
const destFile = process.argv[3];

if (!tmxFile || !destFile) {
  util.puts("Usage: ./tmx2json.js tmx_file.json output_file.json");
  process.exit(0);
}

const parser = new xml2js.Parser();
fs.readFile(tmxFile, 'utf8', (err, tmxData) => {
  if (err) {
    console.error('Error reading TMX file:', err);
    return;
  }
  
  parser.parseString(tmxData, (err, result) => {
    if (err) {
      console.error('Error parsing TMX file:', err);
      return;
    }
    
    const json = JSON.stringify(result, null, 2);
    
    fs.writeFile(destFile, json, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
        return;
      }
      console.log('Finished converting TMX to JSON.');
    });
  });
});
