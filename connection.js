var mysql = require('mysql');

// Create a connection
var conn = 
  mysql.createConnection({
    host: "remotemysql.com", 
    port: "3306",
    user: "U3YmmpbCUq", 
    password: "sFcj3UDIHr",
    database: "U3YmmpbCUq",
    multipleStatements: true
  });

conn.connect(function(err, conn){
    if(err) {
        console.log("Failed to connect to db");
    }
    if(conn) console.log("Connected to db");
})

module.exports = conn;