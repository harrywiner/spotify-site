var tools = require("./tools");
var yargs = require("yargs");
var express = require("express");
var request = require("request");
const mysql = require("mysql");

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var dotenv = require('dotenv');
dotenv.config();
var session = require('express-session');

const port = process.env.PORT || 8000;

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

var stateKey = 'spotify_auth_state';


// https://vast-castle-09510.herokuapp.com/
// https://git.heroku.com/vast-castle-09510.git

var app = express();

app.use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

console.log("Listening on " + port);
app.listen(port);

var secret = tools.generateRandomString(16);

var sess = {
  secret: secret,
  cookie: {},
  resave: false,
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  sess.cookie.secure = true;
}
app.use(session(sess));

app.get("/count-total-plays", function (req, res) {
  var dbPromise = tools.DBConnect("spotify");

  dbPromise.then((connection) => {
    var countPromise = tools.CountPlays(connection);

    countPromise.then((count) => {
      res.send({
        playCount: count,
      });

      connection.end();

      return;
    });
  });
});

app.get("/most-played", function (req, res) {
  var dbPromise = tools.DBConnect("spotify");

  console.log("Offset: " + req.query.offset);
  console.log("Limit: " + req.query.limit);

  dbPromise.then((connection) => {
    var playPromise = tools.MostPlayed(
      connection,
      parseInt(req.query.limit),
      parseInt(req.query.offset)
    );

    playPromise.then((plays) => {
      res.send({
        mostPlayed: plays,
      });

      connection.end();

      return;
    });
  });
});

app.get("/play-time", function (req, res) {
  var dbPromise = tools.DBConnect("spotify");

  console.log("Offset: " + req.query.offset);
  console.log("Limit: " + req.query.limit);

  dbPromise.then((connection) => {
    var playPromise = tools.PlayTime(
      connection,
      parseInt(req.query.limit),
      parseInt(req.query.offset)
    );

    playPromise.then((plays) => {
      console.log(JSON.stringify(plays));
      res.send({
        playTime: plays,
      });

      connection.end();

      return;
    });
  });
});

// START OF AUTH

app.get('/login', function (req, res) {

  var state = tools.generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          //console.log(body);
        });


        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    } else {
      console.log("Error " + response.statusCode + body.error_description)
    }
  });
});

app.get("/most-recent", async (req, res) => {

  access_token = await tools.RefreshToken(req.session.refresh_token, client_id, client_secret)

  var options =
  {
    url: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
    headers: { Authorization: "Bearer " + access_token },
    json: true,
  };

  // Return new promise
  return new Promise(function (resolve, reject) {
    // Do async job
    request.get(options, function (error, response, body) {
      console.log("in request")
      if (error) {
        console.log("Error getting recents: " + error);
        reject(error);
      }

      console.log(" From da body" + body);

      resolve(body);
    });
  }).then((data) => {
    track = {
      "trackName": data.items[0].track.name,
      "artistName": data.items[0].track.artists[0].name,
      "coverURL": data.items[0].track.album.images[0].url
    }
    res.send(track)
  }).catch((error) => {
    res.send()
  });
})

app.get("/currently-playing", async (req, res) => {

  access_token = await tools.RefreshToken(req.session.refresh_token, client_id, client_secret)

  var options = {
    url: "https://api.spotify.com/v1/me/player/currently-playing",
    headers: { Authorization: "Bearer " + access_token },
    json: true,
  };

  // Return new promise
  return new Promise(function (resolve, reject) {
    // Do async job
    request.get(options, function (error, response, body) {
      if (error) {
        console.log("Error getting recents: " + error);
        reject(error);
      } else {
        resolve(body);
      }
    });
  }).then((data) => {
    if (data) {
      track = {
        "trackName": data.item.name,
        "artistName": data.item.artists[0].name,
        "coverURL": data.item.album.images[0].url
      }
      console.log(track)

      res.send(track)
    } else {
      res.send()
    }

  });


})
app.get('/current-or-recent', (req, res) => {
  request.get('/currently-playing', (error, response, body) => {
    if (body) {
      res.send(body)
    } else {
      request.get('http://localhost:8000/most-recent', (error, response, body) => {
        res.send(body)
      })
    }
  })
})