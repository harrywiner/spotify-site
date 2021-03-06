const fs = require("fs");
const mysql = require("mysql");
const { DBConnect } = require("./tools");
const tools = require("./tools");

async function insertPlay(play, con) {
  var sql =
    "INSERT INTO plays (trackName, artistName, endTime, msPlayed) VALUES (?, ?, ?, ?);";
  var inputs = [play.trackName, play.artistName, play.endTime, play.msPlayed];

  sql = con.format(sql, inputs);

  await con.query(sql, function (err, result, fields) {
    if (err) throw err;
  });
}

function selectAll() {
  var sql = "SELECT * FROM plays;";

  con.query(sql, function (err, result, fields) {
    if (err) throw err;
  });
}

// replaces all single quotes with sql escaped single quotes
function formatString(str) {
  var formatStr = str.replace(/'/g, "''");
  if (formatStr.length >= 32) {
    formatStr = formatStr.substr(0, 32);
  }

  return formatStr;
}

async function insertHistory(filename, con) {
  var plays = tools.ReadHistory(filename);

  plays.then((data) => {
    data.forEach(async (element) => {
      var track = {
        trackName: formatString(element.trackName),
        artistName: formatString(element.artistName),
        endTime: element.endTime,
        msPlayed: element.msPlayed,
      };

      await insertPlay(track, con);
    })


    //await tools.wait(10);
  });
  console.log("file complete " + filename)
}

async function createTable(con) {
  var setup = "DROP TABLE plays;";
  var setup2 =
    "CREATE TABLE plays (playID INT AUTO_INCREMENT,trackName varchar (32),artistName varchar (32),endTime varchar (32),msPlayed INT,PRIMARY KEY (playID))";



  return new Promise(function (resolve, reject) {
    con.query(setup, function (err, result, fields) {
      if (err) throw err;

      con.query(setup2, function (err, result, fields) {
        if (err) {
          reject(null)
        };
        console.log("create table result: " + result)
        resolve(null)
      });
    });


  });
}

// timer stopped at 1 hour 45 mins for full upload to micro tier
async function main() {
  //await insertHistory("./json/StreamingHistory0.json");
  con = await DBConnect("spotify")

  createTable(con).then(() => {
    insertHistory("./json/StreamingHistory1.json", con);
    insertHistory("./json/StreamingHistory2.json", con);
    insertHistory("./json/StreamingHistory3.json", con);
    insertHistory("./json/StreamingHistory4.json", con);
    insertHistory("./json/StreamingHistory5.json", con);
    insertHistory("./json/StreamingHistory6.json", con);
  })


  //con.end();
}

main();
