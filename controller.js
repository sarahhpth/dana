'use strict';

var response = require('./res');

exports.index = function (req, res) {
    response.success("You may want to add /api/ in the url", res)
};

