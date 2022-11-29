var mysql = require('mysql');

// Create a connection
var conn = 
  mysql.createConnection({
    host: "sql6.freemysqlhosting.net", 
    port: "3306",
    user: "sql6499049", 
    password: "jnSzNvMWUa",
    database: "sql6499049",
    multipleStatements: true
  });

conn.connect(function(err, conn){
    if(err) {
        console.log("Failed to connect to db");
    }
    if(conn) console.log("Connected to db");
})

module.exports = conn;