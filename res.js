'use strict';

exports.success = function(message, res){
    var data = {
        "status":200,
        "message":message
    };

    res.json(data);
    res.end();
};

exports.failed = function(message, res){
    var data = {
        "status": 400,
        "message": message
    }

    res.status(400).json(data);
    res.end();
}

exports.serverError = function(message, res){
    var data = {
        "status": 500,
        "message": "Server Error"
    }
    return;
}

