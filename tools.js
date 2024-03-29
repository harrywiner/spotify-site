const yargs = require("yargs");
const mysql = require("mysql");
var request = require("request");
const fs = require("fs");
require('dotenv').config()

module.exports = {
  ParseCommandLine: function () {
    var dbName = "recents";
    var fFileInput = false;
    var inputFilename = "";

    var myArgs = process.argv;

    const argv = yargs
      .command("args", "Test application that deals with args using yargs")
      .option("file", {
        alias: "f",
        description: "Name of JSON input file",
        type: "string",
      })
      .option("verbose", {
        alias: "v",
        description: "Output a bunch of messages",
        type: "string",
      })
      .option("database", {
        alias: "d",
        description: "Name of database to write",
        type: "string",
      }).argv;

    console.log(argv);

    if (argv.file != null) {
      console.log(argv.file);
      fFileInput = true;
      inputFilename = argv.file;
    }

    if (argv.database != null) {
      dbName = argv.database;
    }

    console.log(dbName);

    return {
      dbName: dbName,
      fFileInput: fFileInput,
      inputFilename: inputFilename,
    };
  },

  DBConnect: function (dbName) {
    var connection = mysql.createConnection({
      host: process.env.DB_URL,
      user: process.env.DB_USR,
      password: process.env.DB_PWD,
      port: 3306,
      database: dbName
    });

    return new Promise(function (resolve, reject) {
      connection.connect((error) => {
        if (error) {
          console.log("Error connecting to the database: " + error.name);
          reject(error);
        } else {
          console.log("Connected!");
          resolve(connection);
        }
      });
    });
  },

  BuildSelectionKey: function (columns) {
    var result = "";

    for (var i = 0; i < columns.length; i++) {
      var quoteStr = typeof columns[i].val == "number" ? "" : "'";
      result += columns[i].name + "=" + quoteStr + columns[i].val + quoteStr;

      if (i < columns.length - 1) result += " AND ";
    }

    return result;
  },

  BuildInsertValues: function (columns) {
    var result = "";
    var colNames = "";
    var colVals = "";

    for (var i = 0; i < columns.length; i++) {
      colNames += columns[i].name;

      var quoteStr = typeof columns[i].val == "number" ? "" : "'";
      colVals += quoteStr + columns[i].val + quoteStr;

      if (i < columns.length - 1) {
        colNames += ", ";
        colVals += ", ";
      }
    }

    result = "(" + colNames + ") VALUES (" + colVals + ")";

    return result;
  },

  RowExists: function (tableRow, connection) {
    return new Promise((resolve, reject) => {
      var query =
        "SELECT * FROM " +
        tableRow.table +
        " WHERE " +
        this.BuildSelectionKey(tableRow.columns);
      //console.log(query);

      connection.query(query, function (err, result) {
        if (err) {
          console.log("Row Exists error: " + err);

          reject();
        } else {
          //console.log("Count: " + result.length);

          resolve(result.length);
        }
      });
    });
  },

  InsertRow: function (tableRow, connection) {
    return new Promise((resolve, reject) => {
      var insertValues = this.BuildInsertValues(tableRow.columns);
      var query =
        "INSERT INTO " +
        tableRow.table +
        " " +
        insertValues +
        " " +
        "ON DUPLICATE KEY UPDATE `ctPlays` = `ctPlays` + 1";

      connection.query(query, function (err, result) {
        if (err) {
          if (err.code == "ER_DUP_ENTRY") {
            console.log(
              "Duplicate row: " + tableRow.table + " " + insertValues
            );
            resolve(-1);
          } else {
            console.log("Insert Row error: " + err);
            reject();
          }
        } else {
          console.log(query);
          resolve(result.insertId);
        }
      });
    });
  },

  DontInsert: function () {
    return new Promise(function (resolve, reject) {
      //console.log("Row exists, no insert");
      setTimeout(function () {
        resolve(0);
      }, 10);
    });
  },

  wait: function (ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        //console.log("Done waiting");
        resolve(ms);
      }, ms);
    });
  },

  GetMostRecentPlayDate: function (connection) {
    return new Promise((resolve, reject) => {
      var query = "SELECT playedAt FROM play ORDER BY playedAt DESC LIMIT 1";

      connection.query(query, function (err, result) {
        if (err) {
          console.log("Row getting Most Recent Play Date: " + err.errno);

          resolve(0);
        } else {
          //const d = new Date(result[0].playedAt);
          resolve(new Date(result[0].playedAt));
        }
      });
    });
  },

  GetRecents: function (access_token) {
    // Setting URL and headers for request

    var options = {
      url: "https://api.spotify.com/v1/me/player/recently-played?limit=50",
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
          console.log(body);
          resolve(body);
        }
      });
    });
  },

  ReadHistory: function (inputFilename) {
    // Return new promise
    return new Promise(function (resolve, reject) {
      // Do async job
      let rawdata = fs.readFileSync(inputFilename);
      let recentPlays = JSON.parse(rawdata);

      resolve(recentPlays);
    });
  },

  RefreshToken: function (token) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: token
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var access_token = body.access_token;
          resolve(access_token)
        } else {
          reject("Error " + response.statusCode + body.error_description)
        }
      });
    })

  },

  generateRandomString: function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  CountPlays: function (connection) {
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
  },

  MostPlayed: function (connection, limit, offset) {
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
  },

  PlayTime: function (connection, limit, offset) {
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
};
