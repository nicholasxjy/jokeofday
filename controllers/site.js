var config = require('../config');
var User = require('../proxy').User;
var EventProxy = require('EventProxy');
var Joke = require('../proxy').Joke;
var Message = require('../proxy').Message;
var Util = require('../libs/util');

exports.index = function(req, res, next) {
	var cut_user = req.session.user || null;
    var page = parseInt(req.query.page, 10) || 1;
    var limit = config.joke_per_page;
    if (cut_user) {
        //查询当前用户的message 和 最近joke需要分页
        var render = function(recent_jokes, messages, pages) {
            res.render('index', {
                config: config,
                messages: messages,
                pages: pages,
                recent_jokes: recent_jokes,
                limit: limit
            });
        }
        var proxy = EventProxy.create('recent_jokes', 'messages', 'pages', render);
        proxy.fail(next);

        //查询jokes 分页
        var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};

        Joke.getJokesByQuery({}, options, proxy.done('recent_jokes'));
        //此处只需查出未读信息的个数，点击跳转到message页面 在显示其内容
        Message.getMessageCount(cut_user._id, proxy.done(function(messages) {
            messages = messages || 0;
            proxy.emit('messages', messages);
        }));
        Joke.getJokesCountByQuery({}, proxy.done(function(pages_count) {
            var pages = Math.ceil(pages_count/limit);
            proxy.emit('pages', pages);
        }));
    } else {
        var render = function(recent_jokes, pages) {
            res.render('index', {
                config: config,
                recent_jokes: recent_jokes,
                pages: pages,
                limit: limit
            });
        }
        var proxy = EventProxy.create('recent_jokes','pages', render);
        //查询jokes 分页
        var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};
        Joke.getJokesByQuery({}, options, proxy.done('recent_jokes'));
        Joke.getJokesCountByQuery({}, proxy.done(function(pages_count) {
            var pages = Math.ceil(pages_count/limit);
            proxy.emit('pages', pages);
        }));
    }
}