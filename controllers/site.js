var config = require('../config');

exports.index = function(req, res, callback) {
	var current_user = req.session.user || null;
	res.render('index', {
        config: config,
        current_user: current_user
	});
}