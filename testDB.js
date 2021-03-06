const fs = require("fs");
const mysql = require("mysql");
const tools = require("./tools");
require('dotenv').config()

function DBConnect(dbName) {
    //var dbURL = process.env.DB_URL;

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
}


dbPromise = DBConnect("spotify")
dbPromise.then((con) => {
    str = "INSERT INTO person values (?, ?)"
    inputs = ["Boozer", 42]
    str = mysql.format(str, inputs)

    con.query(str, (err, results, field) => {
        console.log(results)
    })

})

