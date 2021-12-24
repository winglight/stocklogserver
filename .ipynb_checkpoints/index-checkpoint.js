// Example express application adding the parse-server module to expose Parse
// compatible API routes.
var getgroups = require('./src/eastmoneyapi.js').getgroups;
var addtogroup = require('./src/eastmoneyapi.js').addtogroup;
var cors = require('cors');

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://host.docker.internal:27017/stocklog',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'stocklog',
  masterKey: process.env.MASTER_KEY || 'dkElkfdjiEOij843lKD', //Add your master key here. Keep it secret!
//   restfulApiKey: process.env.REST_API_KEY || 'dkElkfdjiLKFJIERjdlsfkgjEOij843lKD', 
  serverURL: process.env.SERVER_URL || 'http://localhost:13339/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["LogModel", "ReasonModel"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.use(cors());

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

app.get('/groups', function(req, res) {
    try{
        getgroups().then(function (response) {
            // console.log(response.data);
            res.json(response.data.result.groups);
            // response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
        });

    } catch (e) {
        console.log("get groups error:" + e);
    }
});

app.get('/addtogroup', function(req, res) {
    try{
      let code = req.query.code;
        addtogroup(code).then(function (response) {
            console.log(response.data);
            if(response.data.re){
                res.send(response.data.result.msg);
            }else {
                res.send(response.data.message);
            }

            // response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
        });

    } catch (e) {
        console.log("add to group error:" + e);
    }
});

// Serve static assets from the /public folder
app.use('/front', express.static(path.join(__dirname, './public')));

app.get('/', function(req, res) {
    res.redirect("/front");
});

// Parse Server plays nicely with the rest of your web routes
// app.get('/', function(req, res) {
//   res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
// });

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
// app.get('/test', function(req, res) {
//   res.sendFile(path.join(__dirname, '/public/test.html'));
// });

var port = process.env.PORT || 13339;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
