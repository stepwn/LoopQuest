const cls = require("./lib/class");
const _ = require('underscore');
const BISON = require('bison');
const WebSocket = require('ws');
const http = require('http'); // Use https instead of http
const fs = require('fs');
const Events = require('../../shared/js/gametypes');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expsession = require('express-session');
const SQLiteStore = require('connect-sqlite3')(expsession);
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const sessionStore = new SQLiteStore();
const { minify } = require('uglify-js');

app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 100000 }));
app.use(bodyParser.json());
//app.use(express.static('client'));
app.use('/shared', express.static('shared'));

const sessionsecret = "your secret here"
const sequelize = require('./sequelize'); // Adjust the path to your Sequelize instance
const Session = require('./session'); // Adjust the path to your Session model

// Uglify middleware
const uglifyMiddleware = (req, res, next) => {
  // Check if the requested file is a JavaScript file
  if (req.path.endsWith('.js') && !req.path.includes('require-jquery.js')) {
    // Read the JavaScript file
    const filePath = `client/${req.path}`;
    const code = fs.readFileSync(filePath, 'utf8');

    // Uglify the JavaScript code
    const uglifiedCode = minify(code,{compress: {
        drop_console: false
      }}).code;

    // Set the appropriate content type
    res.setHeader('Content-Type', 'application/javascript');

    // Send the uglified JavaScript code
    res.send(uglifiedCode);
  } else {
    // If the requested file is not a JavaScript file, proceed to the next middleware
    next();
  }
};

// Apply the uglify middleware to the specific middleware responsible for serving JavaScript files
app.use(uglifyMiddleware, express.static('client'));


async function initializeSequelize() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Sync models with the database
    await Session.sync();


    console.log('Sequelize models have been synchronized with the database.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
(async () => {
    try {
      await initializeSequelize();
    } catch (error) {
      console.error('Error:', error);
    }
  })();


  app.post('/update-session', async (req, res) => {
    const { session_id, nfts } = req.body;

    // Log the incoming request data
    //console.log('Request body:', req.body);

    try {
        // Perform actions with the received session ID and NFTs
        console.log('Received session ID:', session_id);

        // Parse the integratedNFTs JSON file
        const integratedNFTsPath = path.join('shared/integratedNFTs.json');
        console.log(integratedNFTsPath);
        const integratedNFTsData = fs.readFileSync(integratedNFTsPath, 'utf8');
        const integratedNFTs = JSON.parse(integratedNFTsData);
        console.log('Integrated NFTs:', integratedNFTs);

        // Filter the NFTs based on the integratedNFTs JSON data
        const userNFTs = Object.values(nfts).filter(nftId => integratedNFTs.hasOwnProperty(nftId));

        // Remove duplicates from the userNFTs array
        const uniqueUserNFTs = [...new Set(userNFTs)];

        console.log('Integrated User NFTs:', uniqueUserNFTs);

        // Save the userNFTs or perform any other actions with the filtered NFTs
        const session = await Session.create({
            session_id: session_id,
            nfts: JSON.stringify(uniqueUserNFTs),
        });

        // Log the created session
        console.log('Created session:', session);

        // Create a JWT token with the session ID as the payload
        const secretKey = "your-secret-key"; // Replace with your own secret key
        const token = jwt.sign({ session_id }, secretKey);

        // Log the created token
        console.log('Created token:', token);

        // Send the token in the response
        res.json({ token });
    } catch (error) {
        console.error('Error processing session ID and NFTs:', error);
        res.status(500).json({ error: error.message });
    }
});
app.use(expsession({
    store: sessionStore,
    secret: sessionsecret, // replace with your own secret
    resave: false,
    saveUninitialized: true,
  }));

  app.post('/', async (req, res) => {
    const { token } = req.body;
  
    try {
      // Verify the token
      const secretKey = "your-secret-key"; // Replace with your own secret key
      const payload = jwt.verify(token, secretKey);
  
      // Get the PHP session ID from the token payload
      const phpSessionId = payload.session_id;
      console.log('PHP session ID:', phpSessionId);
  
      // Look up the session in the database
      const session = await Session.findOne({ where: { session_id: phpSessionId } });
      if (!session) {
        throw new Error('Session not found');
      }
  
      console.log('Retrieved session:', session);
  
      // Parse the list of NFTs from the session
      const nfts = JSON.parse(session.nfts);
      console.log('Retrieved NFTs:', nfts);
  
      // Build the JavaScript code snippet to save NFTs to localStorage and refresh the page
      const jsSnippet = `
        <script>
          // Save NFTs to localStorage
          localStorage.setItem('nfts', JSON.stringify(${JSON.stringify(nfts)}));
  
          // Redirect to "play.loopquest.io"
    window.location.href = "http://play.loopquest.io";
        </script>
      `;
  
      // Send the JavaScript code snippet as the response
      res.send(jsSnippet);
    } catch (error) {
      console.error('Error processing token:', error);
      res.sendStatus(500);
    }
  });
  
  

module.exports = server = cls.Class.extend({
    init: function(port) {
        var self = this;
        app.get('/status', function(request, response) {
            if (self.statusCallback) {
                response.end(self.statusCallback());
            } else {
                response.sendStatus(404);
            }
        });
        this._connections = [];
        this._counter = 0;
        this._httpServer = http.createServer(app);
       // this._httpServer = https.createServer(options,app);
        this._httpServer.listen(port, function() {
            console.log((new Date()) + ' Server is listening on port ' + port);
        });

        this._wsServer = new WebSocket.Server({
            server: this._httpServer,
            autoAcceptConnections: false
        });
        

        this._wsServer.on('error', function(error) {
            if (self.onErrorCallback) {
                self.onErrorCallback(error);
            }
        });

        this._httpServer.on('error', function(error) {
            if (self.onErrorCallback) {
                self.onErrorCallback(error);
            }
        });
    },

    broadcast: function(message) {
        _.each(this._connections, function(connection) {
            connection.send(message);
        });
    },

    forEachConnection: function(callback) {
        _.each(this._connections, function(connection) {
            callback(connection);
        });
    },

    onConnect: function(callback) {
        var self = this;
      
        this._wsServer.on('connection', function(ws, req) {
          self._counter++;
          console.log("counter at "+ self._counter);
          
          // Parse the cookies from the request headers
          const cookies = cookie.parse(req.headers.cookie || '');
      
          // Get the session ID from the cookies
          const sessionId = cookieParser.signedCookie(cookies['connect.sid'], sessionsecret);
      
          // Retrieve the session data from the store
          sessionStore.get(sessionId, (err, session) => {
            if (err || !session) {
              // Handle session retrieval error or missing session
              console.error('Error retrieving session or session not found', err);
              ws.close();
              return;
            }
            
            // If the session is retrieved successfully, create a new Connection with the session data
            var connection = new Connection(ws, self._counter, session);
            self._connections[self._counter] = connection;
      
            connection.onClose(function(id) {
              delete self._connections[id];
            });
            
            if (typeof callback === 'function') {
              callback(connection);
            }
          });
        });
      },
    

    onRequestStatus: function(callback) {
        this.statusCallback = callback;
    },

    onError: function(callback) {
        this.onErrorCallback = callback;
    },
    getConnection: function(id) {
        return this._connections[id];
    }
    
});

var Connection = cls.Class.extend({
    init: function(ws, id, session) {
        console.log('New Connection created with id:', id);
        var self = this;
        this._session = session;
        this._ws = ws;
        this._id = id;
        this._closeCallback = null;
        this._messageCallback = null;

        this._ws.on('message', function(message) {
            if (self._messageCallback) {
                self._messageCallback(message);
            }
        });

        this._ws.on('close', function() {
            if (self._closeCallback) {
                self._closeCallback(self._id);
            }
        });
    },

    send: function(message) {
        //console.log("Sending message from connection " + this._id + ": ", message);
        var jsonMessage = JSON.stringify(message);
        this._ws.send(jsonMessage);
    },
    onClose: function(callback) {
        this._closeCallback = callback;
    },

    onMessage: function(callback) {
        this._messageCallback = callback;
   
    },

    on: function(event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);
    },

    trigger: function(event, data) {
        var callbacks = this._events[event];
        if (callbacks) {
            callbacks.forEach(function(callback) {
                callback(data);
            });
        }
    },
    sendUTF8: function(data) {
        if (this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(data);
        }
    },
    close: function(reason) {
        console.log(reason);
        this._ws.close(1000, reason); // 1000 is a normal closure
    }
});


_.extend(Connection.prototype, Events);
