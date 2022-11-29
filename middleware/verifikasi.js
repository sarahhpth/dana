const jwt = require('jsonwebtoken');
const config = require('../config/secret');
var response = require('../res');

function userErrorResponse(message, res){
    return response.failed(message, res)
}

function verifikasi(){
    return function(req, rest, next){
        //cek authorization header
        var tokenWithBearer = req.headers.authorization;
        
        if(tokenWithBearer) {
            var token = tokenWithBearer.split(' ')[1];
            
            //verifikasi
            jwt.verify(token, config.secret, function(err, decoded){
                if(err){
                    // Token salah
                    return userErrorResponse("Token tidak valid", rest)
                }else {
                    // Token benar
                    next()
                }
            });
        }else {
            return userErrorResponse("Masukkan token", rest)
        }
    }
}

module.exports = verifikasi