/**
 * Created by nicholas_xue on 14-4-5.
 */
var config = require('../config');

exports.signInRequired = function(req, res, next) {
    if (!req.session.user) {
        res.render('notify/notify', {
            error: "请先登录。",
            config: config
        });
    }
    next();
}
