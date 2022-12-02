var mysql = require('mysql');

// Create a connection
var conn = 
  mysql.createConnection({
    host: "localhost", 
    port: "3306",
    user: "root", 
    password: "",
    database: "dana",
    multipleStatements: true
  });

conn.connect(function(err, conn){
    if(err) {
        console.log("Failed to connect to db");
    }
    if(conn) console.log("Connected to db");
})

module.exports = conn;