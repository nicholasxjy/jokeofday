var config = require('../config');
var User = require('../proxy').User;
var EventProxy = require('EventProxy');
var Joke = require('../proxy').Joke;
var Message = require('../proxy').Message;
var Util = require('../libs/util');

exports.index = function(req, res, next) {
    var page = parseInt(req.query.page, 10) || 1;
    var limit = config.joke_per_page;
    //查询当前用户的message 和 最近joke需要分页
    var render = function(recent_jokes, messages, pages) {
        res.render('index', {
            config: config,
            pages: pages,
            recent_jokes: recent_jokes,
            limit: limit
        });
    }
    var proxy = EventProxy.create('recent_jokes', 'pages', render);
    proxy.fail(next);

    //查询jokes 分页
    var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};

    Joke.getJokesByQuery({}, options, proxy.done('recent_jokes'));

    Joke.getJokesCountByQuery({}, proxy.done(function(pages_count) {
        var pages = Math.ceil(pages_count/limit);
        proxy.emit('pages', pages);
    }));
}