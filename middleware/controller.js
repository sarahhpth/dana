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
        balance : '0' // also leave blank
    }

    // raw json request body must be written in this format
    // {
    //     "nama_user": "usersarah2",
    //     "no_hp":"081234",
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
    
                var query = "INSERT INTO users (nama_user, no_hp, password, balance) VALUES (?, ?, ?, ?)";     
                var table = [post.nama_user, post.no_hp, post.password, post.balance];

                conn.query(query, table, function(error, rows){
                    if(error){
                        console.log(error); // if query error
                    }else{
                        console.log("Registered");
                        response.success("Registered", res);
                    }
                });
            }else{
                // if post.no_hpr is found
                console.log("Phone number is already registered to Dana");
                response.failed("Phone number is already registered to Dana", res); 
            }
        }
    });
};




//POST login
exports.login = function(req, res){
    //req
    var post = {
        no_hp : req.body.no_hp,
        password : req.body.pass
    }

    // raw json request body must be written in this format
    // {
    //     "no_hp":"081234",
    //     "pass": "test1234"
    // }

    var query = "SELECT * FROM users WHERE ?? = ? AND ?? = ?";
    var table = ["password", post.password, "no_hp", post.no_hp];   // md5(post.password) if hashed
    query = mysql.format(query, table);

    conn.query(query, function(error, rows){
        
        console.log("test");
        if(error){
             
            // response.success("error", res); 
        }else{
            if(rows.length == 1){
                var token = jwt.sign({rows}, config.secret);

                // parsed token looks like this:
                // {
                //     "rows": [
                //       {
                //         "id_user": 1,
                //         "nama_user": "sarah",
                //         "no_hp": 81234,
                //         "password": "test1234",
                //         "role": 2,
                //         "balance": 0
                //       }
                //     ],
                //     "iat": 1669953823
                //   }

                var user_id = rows[0].id_user;

                res.json({
                    success: true,
                    message: "Login successful",
                    token: token,
                    currUser: user_id
                });
                    
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

    // insert token in Auth
    // raw json request body must be written in this format
    // {
    //     "balance": "300000"
    // }

    var data = parsetoken(token);
    // console.log(data);
    // {
    //     id_user: 1,
    //     nama_user: 'sarah',
    //     no_hp: 81234,
    //     password: 'test1234',
    //     role: 2,
    //     balance: 0
    // }

    var user_id = data.id_user;
    
    conn.query('UPDATE users SET balance = balance + ? WHERE id_user = ?', [topup, user_id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                response.success("Topup successful", res);
            }
        });
};



//POST transfer
exports.transfer = function(req, res){
    //req
    var receiver_hp = req.body.receiver_hp; //receiver's phone
    var amount = req.body.balance;
    var token = req.headers.authorization;

    // insert token in Auth
    // raw json request body must be written in this format
    // {
    //     "receiver_hp": "081235",
    //     "balance": "25000"
    // }

    var data = parsetoken(token);
    // console.log(data);
    // {
    //     id_user: 1,
    //     nama_user: 'sarah',
    //     no_hp: 81234,
    //     password: 'test1234',
    //     role: 2,
    //     balance: 0
    // }
    
    var sender_id = data.id_user;
    var sender_name = data.nama_user;

    conn.query('SELECT id_user, nama_user FROM users WHERE no_hp = ?', [receiver_hp], function(error, rows, fields){
        var receiver_id = rows[0].id_user;
        var receiver_name = rows[0].nama_user;
        if(error){
            console.log(error);
        }else if(sender_id == receiver_id){
            response.failed("You cannot transfer to yourself", res);
        }else{
            //cek saldo sender
            conn.query('SELECT balance from users WHERE id_user = ?',[sender_id],
                function(error, rows, fields){
                    var sender_balance = rows[0].balance
                    if(sender_balance < amount){
                        response.failed("Topup first", res);
                    }else{
                        conn.query('UPDATE users SET balance = balance - ? WHERE id_user = ? ;'+
                        'UPDATE users SET balance = balance + ? WHERE id_user = ? ;'+
                        'INSERT INTO transaksi (id_pengirim, id_penerima, pengirim, penerima, jumlah, status) VALUES (?,?,?,?,?, 1)',
                        [   amount, sender_id, 
                            amount, receiver_id, 
                            sender_id, receiver_id, sender_name, receiver_name, amount
                        ],
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

//POST transaksi/pembayaran ke Tix ID
exports.transaksi = function(req, res){
    //req
    var amount = req.body.price;
    var token = req.headers.authorization;

    // insert token in Auth
    // raw json request body must be written in this format
    // {
    //     "price": "25000"
    // }

    var data = parsetoken(token);
    // console.log(data);
    // {
    //     id_user: 1,
    //     nama_user: 'sarah',
    //     no_hp: 81234,
    //     password: 'test1234',
    //     role: 2,
    //     balance: 0
    // }
    
    var user_id = data.id_user;
    var user_name = data.nama_user;

    //cek saldo sender
    conn.query('SELECT balance from users WHERE id_user = ?',[user_id],
        function(error, rows, fields){
        var user_balance = rows[0].balance;
        if(user_balance < amount){
            response.failed("Topup first", res);
        }else{
            
            conn.query('UPDATE users SET balance = balance - ? WHERE id_user = ? ;' + 
            'UPDATE users SET balance = balance + ? WHERE id_user = 1 ;'+
            'INSERT INTO transaksi (id_pengirim, id_penerima, pengirim, penerima, jumlah, status) VALUES (?,1,?,"tixid",?, 1)',
            [
                amount, user_id,
                amount,
                user_id, user_name, amount
            ],
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
    // console.log(data);
    // {
    //     id_user: 1,
    //     nama_user: 'sarah',
    //     no_hp: 81234,
    //     password: 'test1234',
    //     role: 2,
    //     balance: 0
    // }

    var id = data.id_user;
    
    conn.query('SELECT * FROM users WHERE id_user = ?', [id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                res.json({
                    id: rows[0].id_user,
                    name: rows[0].nama_user,
                    no_hp: rows[0].no_hp,
                    password: rows[0].password,
                    balance: rows[0].balance,
                    
                });
                // console.log(data);
                // res.json(data);
                // response.success(data, res);
            }
    });
    
  
};


//GET history
exports.history = function(req, res){
    //req
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // console.log(data);
    // {
    //     id_user: 1,
    //     nama_user: 'sarah',
    //     no_hp: 81234,
    //     password: 'test1234',
    //     role: 2,
    //     balance: 0
    // }

    var id = data.id_user;
    
    conn.query('SELECT * FROM transaksi WHERE id_pengirim = ?', [id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else if(rows.length == 0){
                response.failed("You have not made any transactions yet", res);
                
            }else{
                console.log(rows.length);
                var history = [];
                rows.forEach(element => {
                    
                    // history.push(element.pengirim);
                    history.push(element);
                });
                console.log(history[1]);
                response.success(history, res);

                // for (var i = 0; i < rows.length; i++){
                //     history.push(
                //         rows[i].pengirim,
                //         rows[i].penerima,
                //         rows[i].jumlah,
                //         rows[i].datetime

                //     )
                // }
                // console.log(history);
                // response.success(history, res);

                
            }
    });
    
  
};

//GET history instance
exports.history_inst = function(req, res){

    var id = req.params.id;
    
    conn.query('SELECT * FROM transaksi WHERE id_transaksi = ?', [id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else if(rows.length == 0){
                response.failed("Transaction not found", res);
                
            }else{
                console.log(rows.length);
                var history = [];
                rows.forEach(element => {
                    
                    history.push(element);
                });
                console.log(history);
                response.success(history, res);

                
            }
    });
    
  
};















