var mysql = require("mysql");

var url =
  "mysql://hhqku4m4s06d7kkr:qhduvhfosmtue8ka@d9c88q3e09w6fdb2.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/fjdra43pw35frotj";
var connection = mysql.createConnection(url);

connection.connect();

connection.query("SELECT 1 + 1 AS solution", function (err, rows, fields) {
  if (err) throw err;

  console.log("The solution is: ", rows[0].solution);
});

connection.end();
