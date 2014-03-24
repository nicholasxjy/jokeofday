/**
 * Created by nicholas_xue on 14-3-24.
 */
var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Relation = require('../proxy').Relation;
var EventProxy = require('eventproxy');

exports.index = function(req, res, next) {
    var username = req.params.name;
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('notify/notify', {
                error: "该用户不存在。",
                config: config
            });
            return;
        }
        //接下来 要根据此user查出该user的 未读message数量 关注几个人 被关注几人  最近发表的joke
        //此处需要 eventproxy，不然会嵌套太深，掉坑里。
        //npm new package
        var render = function(recent_jokes, relation) {
            res.render('user/index', {
                user: user,
                config:config,
                recent_jokes: recent_jokes,
                relation: relation
            });
        }
        var proxy = new EventProxy();
        proxy.assign('recent_jokes', 'relation', render);
        proxy.fail(next);

        var query = {author_id:user._id};
        var opts = {limit: 5, sort:[['create_at', 'desc']]};
        Joke.getJokesByQuery(query, opts, proxy.done('recent_jokes'));

        if (!req.session.user) {
            proxy.emit('relation', null);
        } else {
            //获取 user 和req.session.user的关注关系，user是通过url的name参数获得的，而req.session.user是当前登录用户
            //也就是说当前登录用户，去查看别的用户主页
            Relation.getRelation(req.session.user._id, user._id, proxy.done('relation'));//此处是为了前端显示 关注还是取消关注
        }

    });
};