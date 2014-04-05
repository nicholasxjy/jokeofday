var config = require('../config');
var User = require('../proxy').User;

exports.index = function(req, res, next) {
	var current_user = req.session.user || null;
    if (current_user) {
        User.getUserById(req.session.user._id, function(err, user) {
            if (err) {
                return next(err);
            }
            res.render('index', {
                config: config,
                current_user: user
            });
        })
    } else {
        res.render('index', {
            config: config,
            current_user: current_user
        });
    }

}