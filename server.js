var tools = require("./tools");
var yargs = require("yargs");
var express = require("express");
var request = require("request");
const mysql = require("mysql");

const port = process.env.PORT || 8000;

// https://vast-castle-09510.herokuapp.com/
// https://git.heroku.com/vast-castle-09510.git

var app = express();

app.use(express.static(__dirname + "/"));

console.log("Listening on " + port);
app.listen(port);

function CountPlays(connection) {
  return new Promise((resolve, reject) => {
    var query = "SELECT COUNT(*) as playCount FROM plays;";

    console.log(query);

    connection.query(query, function (err, result) {
      if (err) {
        console.log("Count Plays error: " + err);

        reject();
      } else {
        resolve(result[0].playCount);
      }
    });
  });
}

function MostPlayed(connection, limit, offset) {
  return new Promise((resolve, reject) => {
    var query =
      "select trackName, artistName, count(*) as times from plays where msPlayed >= 10000 group by trackName, artistName order by times desc LIMIT ? OFFSET ?;";
    var inputs = [limit, offset];

    query = connection.format(query, inputs);

    connection.query(query, function (err, result) {
      if (err) {
        console.log("Most Played error: " + err);

        reject();
      } else {
        resolve(result);
      }
    });
  });
}

function PlayTime(connection, limit, offset) {
  return new Promise((resolve, reject) => {
    var query =
      "select trackName, artistName, sum(msPlayed) as timeListened from plays group by trackname, artistName order by timeListened desc limit ? offset ?;";
    var inputs = [limit, offset];

    query = connection.format(query, inputs);

    connection.query(query, function (err, result) {
      if (err) {
        console.log("Most Played error: " + err);

        reject();
      } else {
        resolve(result);
      }
    });
  });
}

app.get("/count-total-plays", function (req, res) {
  var dbPromise = tools.DBConnect("spotify");

  dbPromise.then((connection) => {
    var countPromise = CountPlays(connection);

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
    var playPromise = MostPlayed(
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
    var playPromise = PlayTime(
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
