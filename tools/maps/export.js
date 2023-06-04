const { execSync } = require('child_process');

const SRC_FILE = 'tmx/map2.tmx';
const TEMP_FILE = SRC_FILE + '.json';

const mode = process.argv[2] || 'client';
//const DEST_FILE = mode === 'client' ? 'world_client2' : 'world_server2.json';

// Convert the Tiled TMX file to a temporary JSON file
execSync(`node tmx2json.js ${SRC_FILE} ${TEMP_FILE}`, { stdio: 'inherit' });

// Map exporting
execSync(`node exportmap.js ${TEMP_FILE} world_client.json client`, { stdio: 'inherit' });
//execSync(`node exportmap.js ${TEMP_FILE} world_server server`, { stdio: 'inherit' });

// Remove temporary JSON file
//execSync(`rm ${TEMP_FILE}`, { stdio: 'inherit' });

// Send a Growl notification when the export process is complete
// execSync(`growlnotify --appIcon Tiled -name "Map export complete" -m "${DEST_FILE} was saved"`, { stdio: 'inherit' });
