const _ = require('underscore');
const Types = require("../../shared/js/gametypes");

let map,
  mode,
  collidingTiles = {},
  staticEntities = {},
  mobsFirstgid;

module.exports = (json, options) => {
  map = {
    width: 0,
    height: 0,
    collisions: [],
    doors: [],
    checkpoints: [],
    musicAreas: [],
    chestAreas: [],
    staticChests: [],
    staticEntities: {},
    roamingAreas: [],
    data: [],
    high: [],
    animated: {},
    blocking: [],
    plateau: [],
  };
  //mode = "server";
  mode = "client";

  console.log("Processing map info...");
  console.log(mode);
  map.width = parseInt(json.map.$.width);
  map.height = parseInt(json.map.$.height);
  map.tilesize = parseInt(json.map.$.tilewidth);

  const handleTileProp = (propName, propValue, tileId) => {
    if (propName === "c") {
      collidingTiles[tileId] = true;
    }
  
    if (mode === "client") {
      if (propName === "v") {
        map.high.push(tileId);
      }
      if (propName === "length") {
        if (!map.animated[tileId]) {
          map.animated[tileId] = {};
        }
        map.animated[tileId].l = propValue;
      }
      if (propName === "delay") {
        if (!map.animated[tileId]) {
          map.animated[tileId] = {};
        }
        map.animated[tileId].d = propValue;
      }
    }
  };
  

  _.each(json.map.tileset, (tileset) => {
    if (tileset.$.name === "tilesheet") {
      console.log("Processing terrain properties...");
      const tileProperties = tileset.tile;
      _.each(tileProperties, (tile) => {
        const properties = tile.properties[0].property;
        const tilePropertyId = parseInt(tile.$.id) + 1;

        _.each(properties, (property) => {
            //console.log(property.$.name, property.$.value, tilePropertyId);
            handleTileProp(property.$.name, property.$.value, tilePropertyId);
        });
      });
    } else if (tileset.$.name === "Mobs" && mode === "server") {
      console.log("Processing static entity properties...");
      mobsFirstgid = parseInt(tileset.$.firstgid);
      console.log(mobsFirstgid);
      _.each(tileset.tile, (tile) => {
        const property = tile.properties[0].property[0];
        console.log(property);
        const id = parseInt(tile.$.id) + 1;
        

        if (property.$.name === "type") {
          staticEntities[id] = property.$.value;
        }
      });
    }
  });

  _.each(json.map.objectgroup, (group) => {
    if (group.$.name === 'doors') {
      console.log("Processing doors...");
      _.each(group.object, (door, index) => {
        map.doors[index] = {
          x: parseInt(door.$.x) / map.tilesize,
          y: parseInt(door.$.y) / map.tilesize,
          p: door.$.type === 'portal' ? 1 : 0,
        };

        _.each(door.properties[0].property, (doorProperty) => {
          let val = parseInt(doorProperty.$.value);
          if (isNaN(val)) {
            val = doorProperty.$.value;
          }
          //console.log(val);
          map.doors[index]['t' + doorProperty.$.name] = val;
        });
        
      });
    } else if (group.$.name === "roaming" && mode === "server") {
      console.log("Processing roaming areas...");
      _.each(group.object, (area, index) => {
        const nb = area.properties ? parseInt(area.properties[0].property[0].$.value) : undefined;

        map.roamingAreas[index] = {
          id: index,
          x: Math.floor(parseInt(area.$.x) / 16),
          y: Math.floor(parseInt(area.$.y) / 16),
          width: Math.floor(parseInt(area.$.width) / 16),
          height: Math.floor(parseInt(area.$.height) / 16),
          type: area.$.type,
          nb: nb,
        };
      });
    } else if (group.$.name === "chestareas" && mode === "server") {
      console.log("Processing chest areas...");
      _.each(group.object, (area) => {
        const chestArea = {
          x: Math.floor(parseInt(area.$.x) / map.tilesize),
          y: Math.floor(parseInt(area.$.y) / map.tilesize),
          w: Math.floor(parseInt(area.$.width) / map.tilesize),
          h: Math.floor(parseInt(area.$.height) / map.tilesize),
        };
        _.each(area.properties[0].property, (prop) => {
          if (prop.$.name === 'items') {
            chestArea['i'] = _.map(prop.$.value.split(','), (name) => {
              return Types.getKindFromString(name);
            });
          } else {
            chestArea['t' + prop.$.name] = parseInt(prop.$.value);
          }
        });
        map.chestAreas.push(chestArea);
      });
    } else if (group.$.name === "chests" && mode === "server") {
      console.log("Processing static chests...");
      _.each(group.object, (chest) => {
        const items = chest.properties[0].property[0].$.value;
        const newChest = {
          x: Math.floor(parseInt(chest.$.x) / map.tilesize),
          y: Math.floor(parseInt(chest.$.y) / map.tilesize),
          i: _.map(items.split(','), (name) => {
            return Types.getKindFromString(name);
          }),
        };
        map.staticChests.push(newChest);
      });
    } else if (group.$.name === "music" && mode === "client") {
      console.log("Processing music areas...");
      _.each(group.object, (music) => {
        const musicArea = {
          x: Math.floor(parseInt(music.$.x) / map.tilesize),
          y: Math.floor(parseInt(music.$.y) / map.tilesize),
          w: Math.floor(parseInt(music.$.width) / map.tilesize),
          h: Math.floor(parseInt(music.$.height) / map.tilesize),
          id: music.properties[0].property[0].$.value,
        };
        map.musicAreas.push(musicArea);
      });
    } else if (group.$.name === "checkpoints") {
      console.log("Processing check points...");
      let count = 0;
      _.each(group.object, (checkpoint) => {
        const cp = {
          id: ++count,
          x: Math.floor(parseInt(checkpoint.$.x) / map.tilesize),
          y: Math.floor(parseInt(checkpoint.$.y) / map.tilesize),
          w: Math.floor(parseInt(checkpoint.$.width) / map.tilesize),
          h: Math.floor(parseInt(checkpoint.$.height) / map.tilesize),
        };
        if (mode === "server") {
          cp.s = checkpoint.$.type ? 1 : 0;
        }
        map.checkpoints.push(cp);
      });
    }
  });

  _.each(json.map.layer, (layer) => {
    processLayer(layer);
  });

  if (mode === "client") {
    // Set all undefined tiles to 0
    for (let i = 0, max = map.data.length; i < max; i += 1) {
      if (!map.data[i]) {
        map.data[i] = 0;
      }
    }
  }

  return map;
};

const processLayer = (layer) => {
    try {
        //console.log(mode);
        if (mode === "server") {
          if (layer.$.name === "entities") {
            console.log("Processing positions of static entities ...");
            console.log(staticEntities);
            const tiles = layer.data[0].tile;
        
            _.each(tiles, (tile) => {
              try {
                const gid = tile.$.gid;
                //console.log(gid);
                if (gid !== undefined) {
                  const gidValue = parseInt(gid) - mobsFirstgid + 1;
                  console.log(gidValue);
                    const staticEntity = staticEntities[gidValue];
                    const id = _.indexOf(tiles,tile);
                    console.log(id, staticEntity);
                    map.staticEntities[id] = staticEntity;
                }
              } catch (e) {
                //console.error("Error processing static entity:", e);
              }
            });
          }
        }
        
      if(layer.$.name === "blocking" && mode === "client"){
        console.log("Processing layer: " + layer.$.name);
  
        const tiles = layer.data[0].tile;
  
        if (Array.isArray(tiles)) {
          _.each(tiles, (tile) => {
            try {
              const gid = tile.$.gid;
              //console.log(gid);
            const index = _.indexOf(tiles,tile);
                map.blocking.push(index);
            } catch (e) {}
          });
        } 
      }
      else if(layer.$.name === "plateau" && mode === "client"){
        console.log("Processing layer: " + layer.$.name);
  
        const tiles = layer.data[0].tile;
  
        if (Array.isArray(tiles)) {
          _.each(tiles, (tile) => {
            try {
              const gid = tile.$.gid;
              //console.log(gid);
            const index = _.indexOf(tiles,tile);
                map.plateau.push(index);
            } catch (e) {}
          });
        } 
      }
      else if (layer.$.name !== "entities") {
        console.log("Processing layer: " + layer.$.name);
      
        const tiles = layer.data[0].tile;
      
        if (Array.isArray(tiles)) {
          _.each(tiles, (tile) => {
            try {
              const gid = tile.$.gid;
              const gidValue = parseInt(gid);
              const index = _.indexOf(tiles, tile);
              if (map.data[index] === undefined) {
                map.data[index] = gidValue;
              } else if (map.data[index] instanceof Array) {
                map.data[index].push(gidValue);
              } else {
                map.data[index] = [map.data[index], gidValue];
              }
              // colliding tiles
              if (gid in collidingTiles) {
                map.collisions.push(index);
              }
            } catch (e) {}
          });
        }
      }
      
    } catch (e) {}
  };
  