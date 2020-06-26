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

//hhqku4m4s06d7kkr:qhduvhfosmtue8ka@d9c88q3e09w6fdb2.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/fjdra43pw35frotj

mysql: function CountPlays(connection) {
  return new Promise((resolve, reject) => {
    var query = "SELECT COUNT(*) as playCount FROM PLAYS;";

    console.log(query);

    connection.query(query, function (err, result) {
      if (err) {
        console.log("Count Recents error: " + err);

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

    console.log(query);

    connection.query(query, function (err, result) {
      if (err) {
        console.log("Count Recents error: " + err);

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

    countPromise.then((playCount) => {
      console.log("Number of plays: " + playCount);

      res.send({
        hello: playCount,
      });

      connection.end();

      return;
    });
  });
});

app.get("/most-played", function (req, res) {
  console.log("mostplayed called");

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
      console.log("10 most played: " + JSON.stringify(plays));

      res.send({
        hello: plays,
      });

      connection.end();

      return;
    });
  });
});
