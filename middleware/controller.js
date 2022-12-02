'use strict';

var response = require('../res');
const conn = require('../connection');
var mysql = require('mysql');
// var md5 = require('MD5');
var jwt = require('jsonwebtoken');
var config = require('../config/secret');
var ip = require('ip');
let referralCodeGenerator = require('referral-code-generator'); // generate nomor_wallet
var parsetoken = require('./parseJWT'); //used once already logged in

//GET index
exports.index = function(req, res){
    response.success("Semoga pas demo ga error yhhhhhhh", res)
};

//POST register
exports.register = function(req, res){
    //req
    var post = {
        nama_user : req.body.nama_user,
        no_hp : req.body.no_hp,
        password : req.body.pass,   //md5(req.body.password)
        role : '2', // role user 2, admin 1. leave blank
        balance : '0' // also leave blank
    }

    // raw json request body must be written in this format
    // {
    //     "nama_user": "usersarah2",
    //     "no_hp":"usersarah2@gmail.com",
    //     "pass": "test1234"
        
    // }
                        
    // check if the account has already registered, using this query
    var query = "SELECT no_hp FROM users WHERE ?? = ?"; //double "??" for sql query, single "?" for variable
    var table = ["no_hp", post.no_hp];
    query = mysql.format(query, table);

    conn.query(query, function(error, rows){
        if(error){
            console.log(error); // if query error
        }else{
            if(rows.length == 0){   // post.no_hp is not found in db
    
                var query = "INSERT INTO users (nama_user, no_hp, password, role, balance) VALUES (?, ?, ?, ?, ?)";     
                var table = [post.nama_user, post.no_hp, post.password, post.role, post.balance];

                conn.query(query, table, function(error, rows){
                    if(error){
                        console.log(error); // if query error
                    }else{
                        console.log("Registered");
                        response.success("Registered", res);
                    }
                });
            }else{
                console.log("Phone number is already registered to Dana");
                response.failed("Phone number is already registered to Dana", res); //else if found
            }
        }
    });
};

//POST login
exports.login = function(req, res){
    //req
    var post = {
        email : req.body.email,
        password : req.body.pass
    }

    var query = "SELECT * FROM users WHERE ?? = ? AND ?? = ?";
    var table = ["password", post.password, "email", post.email];   // md5(post.password) if hashed
    query = mysql.format(query, table);

    conn.query(query, function(error, rows){
        
        console.log("test");
        if(error){
             
            // response.success("error", res);
        }else{
            if(rows.length == 1){
                var token = jwt.sign({rows}, config.secret);

                var user_id = rows[0].id;
                var data = {
                    user_id: user_id,
                    access_token: token,
                    ip_address: ip.address()
                }

                // var query = "INSERT INTO ?? SET ?";
                // var table = ["token"]; 
                // query = mysql.format(query, table);

                // conn.query(query, data, function(error, rows){
                    if(error){
                        console.log(error);
                    }else{
                        res.json({
                            success: true,
                            message: "Login successful",
                            token: token,
                            currUser: data.user_id
                        });
                    }
                // });
            }else{
                console.log("incorrect password/email");
                res.json({
                    "error": true,
                    "message": "Incorrect password or email"
                });

            }
        }
    });
};


//PUT user topup
exports.topup = function(req, res){
    //req
    var token = req.headers.authorization;
    var topup = req.body.balance;

    var data = parsetoken(token);
    
    // var data = parsedtoken.rows[0];
    // console.log(data);
    var id = data.id;
    
    conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [topup, id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                response.success("Topup successful", res);
            }
        });
};

//PUT transfer
exports.transfer = function(req, res){
    //req
    var receiver_email = req.body.email; //receiver's email
    var amount = req.body.balance;
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // var data = parsedtoken.rows[0];
    
    var sender_id = data.id;
    var sender_name = data.name;

    conn.query('SELECT id, name FROM users WHERE email = ?', [receiver_email], function(error, rows, fields){
        var receiver_id = rows[0].id;
        var receiver_name = rows[0].name;
        if(error){
            console.log(error);
        }else if(sender_id == receiver_id){
            response.failed("You cannot transfer to yourself", res);
        }else{
            //cek saldo sender
            conn.query('SELECT balance from users WHERE id = ?',[sender_id],
                function(error, rows, fields){
                    var sender_balance = rows[0].balance
                    if(sender_balance < amount){
                        response.failed("Topup first", res);
                    }else{
                        conn.query('UPDATE users SET balance = balance - ? WHERE id = ? ;'+
                        'UPDATE users SET balance = balance + ? WHERE id = ? ;'+
                        'INSERT INTO transactions (sender_id,receiver_id,sender,receiver,amount) VALUES (?,?,?,?,?)',
                        [amount, sender_id, amount, receiver_id, 
                            sender_id, receiver_id, sender_name, receiver_name, amount],
                        function(error, rows, fields){
                            if(error){
                                console.log(error);
                            }else{
                                response.success("Transfered successfully", res);
                            }
                        
                        });
                    }

            });
        }

    })

};

//POST transaksi/pembayaran
exports.transaksi = function(req, res){
    //req
    var amount = req.body.balance;
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // var data = parsedtoken.rows[0];
    
    var user_id = data.id;

    //cek saldo sender
    conn.query('SELECT balance from users WHERE id = ?',[user_id],
        function(error, rows, fields){
            var user_balance = rows[0].balance
            if(user_balance < amount){
                response.failed("Topup first", res);
            }else{
                conn.query('UPDATE users SET balance = balance - ? WHERE id = ?',
                [amount, user_id],
                function(error, rows, fields){
                    if(error){
                        console.log(error);
                    }else{
                        response.success("Payment successful", res);
                    }
                
                });
            }

    });
        

    

};


//GET profile
exports.profile = function(req, res){
    //req
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // var data = parsedtoken.rows[0];

    var id = data.id;
    
    conn.query('SELECT * FROM users WHERE id = ?', [id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                res.json({
                    id: rows[0].id,
                    name: rows[0].name,
                    email: rows[0].email,
                    password: rows[0].password,
                    nomor_wallet: rows[0].nomor_wallet,
                    balance: rows[0].balance,
                    // "id": data.id,
                    // "name": data.name,
                    // "email": data.email,
                    // "password": data.password,
                    // "balance": data.balance
                });
                // console.log(data);
                // res.json(data);
                // response.success(data, res);
            }
    });
    
  
};












