var config = require('../config');

exports.index = function(req, res, callback) {
	res.render('index', {
        config: config
	});
}