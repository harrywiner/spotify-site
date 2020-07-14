const mysql = require("mysql");

module.exports = {
  FormatMS: function (ms) {
    var milliseconds = parseInt((ms % 1000) / 100),
      seconds = Math.floor((ms / 1000) % 60),
      minutes = Math.floor((ms / (1000 * 60)) % 60),
      hours = Math.floor(ms / (1000 * 60 * 60));

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
  },

  DBConnect: function (dbName) {
    var dbURL = process.env.JAWSDB_URL;

    if (dbURL == null || dbURL == "")
      dbURL = "mysql://root:harry4657@localhost:3306/" + dbName;

    connection = mysql.createConnection(dbURL);

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
};
