/**
 * Created by nicholas_xue on 14-3-23.
 */
var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.db, function(err) {
    if (err) {
        console.error("connect %s error:", config.db, err.message);
        process.exit(1);
    }
});

//models

require('./user');
require('./message');

exports.User = mongoose.model('User');
exports.Message = mongoose.model('Message');
