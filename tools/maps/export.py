#!/usr/bin/env python3
import subprocess
import sys

SRC_FILE = 'tmx/map2.tmx'

TEMP_FILE = SRC_FILE + '.json'

mode = sys.argv[1] if len(sys.argv) > 1 else 'client'
if mode == 'client':
    DEST_FILE = 'world_client2'  # This will save two files (See exportmap.js)
else:
    DEST_FILE = 'world_server2.json'

# Convert the Tiled TMX file to a temporary JSON file
subprocess.run(['tmx2json.py', SRC_FILE, TEMP_FILE], check=True)

# Map exporting
subprocess.run(['exportmap.js', TEMP_FILE, DEST_FILE, mode], check=True)

# Remove temporary JSON file
subprocess.run(['rm', TEMP_FILE], check=True)

# Send a Growl notification when the export process is complete
#subprocess.run(['growlnotify', '--appIcon', 'Tiled', '-name', 'Map export complete', '-m', DEST_FILE + ' was saved'], check=True)
