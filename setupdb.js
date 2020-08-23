const fs = require("fs");
const mysql = require("mysql");
const tools = require("./tools");

function ReadHistory(filename) {
  let rawdata = fs.readFileSync(filename);

  let recentPlays = JSON.parse(rawdata);
  return recentPlays;
}

var dbURL = process.env.JAWSDB_URL;

if (dbURL == null || dbURL == "")
  dbURL = "mysql://root:harry4657@localhost:3306/" + "spotify";

con = mysql.createConnection(dbURL);

con.connect(function (err) {
  if (err) throw err;
});

var setup = "DROP TABLE plays;";
var setup2 =
  "CREATE TABLE plays (playID INT AUTO_INCREMENT,trackName varchar (32),artistName varchar (32),endTime varchar (32),msPlayed INT,PRIMARY KEY (playID))";

con.query(setup, function (err, result, fields) {
  if (err) throw err;
});

con.query(setup2, function (err, result, fields) {
  if (err) throw err;
});

async function addToDatabase(play) {
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

async function insertHistory(filename) {
  var recentPlays = ReadHistory(filename);
  for (i = 0; i < recentPlays.length; i++) {
    recentPlays[i].trackName = formatString(recentPlays[i].trackName);
    recentPlays[i].artistName = formatString(recentPlays[i].artistName);
    await addToDatabase(recentPlays[i]);
    //await tools.wait(10);
  }
}
// todo make i value in  for loop determine amount
// insertHistory("./json/StreamingHistory0.json");

/*
  insertHistory("./json/StreamingHistory1.json");
  insertHistory("./json/StreamingHistory2.json");
  insertHistory("./json/StreamingHistory3.json");

  
  */

async function main() {
  await insertHistory("./json/StreamingHistory0.json");
  await insertHistory("./json/StreamingHistory1.json");
  await insertHistory("./json/StreamingHistory2.json");
  await insertHistory("./json/StreamingHistory3.json");
  con.end();
}

main();
