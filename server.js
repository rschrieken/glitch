// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
const crypto = require('crypto');
const WebSocket = require('ws');
const fs = require('fs')

var se = require('./se-login.js');
var app = express();

app.set('views', './views') // specify the views directory
app.set('view engine', 'pug') // register the template engine

app.use(bodyParser.urlencoded(
  { extended: false, 
   limit: 100 }));

app.use(cookieParser(process.env.COOKIESECRET));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

function genericErrors (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('oops', {title: 'Bot Control - Error'});
}

app.use(genericErrors);

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  if (se.isInitialized()) {
    var statusmodel = se.status();
    var frontendowner = (buf.toString('base64') === request.signedCookies.frontendowner) 
    response.render('start', { title: 'Bot Control', status: statusmodel, frontendowner: frontendowner});  
  } else {
    response.render('index', {title: 'Bot Control'});
  }
});

app.get("/status", function (request, response) {
  if (se.isInitialized()) {
    response.status(200).json(se.status())
  } else {
    response.status(418).json({})
  }
} );

app.get("/test", function (request, response) {
  var html = '<html><head><link href="style.css" rel="stylesheet"></head><body>';
  fs.readFile('./views/test.html', 'utf8', function (err,data) {
    if (err) {
      html+= 'no file';
      console.log(err);
    } else {
      console.log(data);
      html+= data;
    }
    response.send(html+'</body></html>');
    response.end();
  });
  
} );


var buf;

app.post("/start", function (request, response) {
  if (se.isLoginValid(request.body)) {
    se.login(request.body.user, request.body.pwd, request.body.roomId, request.body.server).
    then(msg => {
      buf = crypto.randomBytes(256);
      response.cookie('frontendowner', buf.toString('base64'), {signed: true});
      response.render('start', { title: 'Bot Control', status: msg, frontendowner:true });
    }).
    catch(msg => {
      response.render('index', {title: 'Bot Control', error: msg});
    });
    
  } else {
    response.render('index', {title: 'Bot Control', error: 'Invalid input'});
  }
});

app.get("/stop", function (request, response){
  if(buf.toString('base64') === request.signedCookies.frontendowner) {
    se.stop();
    response.redirect('/');
  } else {
    response.status(404);
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

const wss = new WebSocket.Server({ server:listener });

wss.on('connection', function connection(ws) {
  //const location = url.parse(ws.upgradeReq.url, true);
  // You might use location.query.access_token to authenticate or share sessions 
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312) 
 
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  const action = (a) => {
    console.log('action %s', a);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({event: 'action', payload: a}));
    }
  };
  se.statusEvents().on('action', action);
  
  const status = (a) => {
    console.log('status %s', a);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({event: 'status', payload: a}));
    }
  };
  se.statusEvents().on('status', status);
  
  const tick = (a) => {
    console.log('tick %s', a);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({event: 'tick', payload: a}));
    }
  };
  se.statusEvents().on('tick', tick);
  
  ws.on('close', function() {
    console.log('ws closed: %s', ws);
    se.statusEvents().removeListener('action', action);
    se.statusEvents().removeListener('status', status);
    se.statusEvents().removeListener('tick', tick);
  });
});

