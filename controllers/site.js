var config = require('../config');
var User = require('../proxy').User;
var EventProxy = require('EventProxy');
var Joke = require('../proxy').Joke;
var Message = require('../proxy').Message;

exports.index = function(req, res, next) {
	var current_user = req.session.user || null;
    var page = parseInt(req.query.page, 10) || 1;
    var limit = config.joke_per_page;
    if (current_user) {
        User.getUserById(req.session.user._id, function(err, user) {
            if (err) {
                return next(err);
            }

            //查询当前用户的message 和 最近joke需要分页
            var render = function(recent_jokes, messages, pages) {
                res.render('index', {
                    config: config,
                    current_user: user,
                    messages: messages,
                    pages: pages,
                    recent_jokes: recent_jokes,
                    limit: limit
                });
            }
            var proxy = new EventProxy.create('recent_jokes', 'messages', 'pages', render);
            proxy.fail(next);

            //查询jokes 分页
            var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};

            Joke.getJokesByQuery({}, options, function(recent_jokes) {
                proxy.assign('user_save', recent_jokes.length, function(err) {
                    if (err) {
                        return next(err);
                    }
                    proxy.emit('recent_jokes', recent_jokes);
                });
                if (recent_jokes.length > 0) {
                    recent_jokes.forEach(function(joke) {
                        User.getUserById(joke.author_id, function(err, user) {
                            if (err) {
                                return next(err);
                            }
                            joke.user = user;
                            proxy.emit('user_save', joke);
                        });
                    });
                } else {
                    proxy.emit('recent_jokes', recent_jokes);
                }
            });
            //此处只需查出未读信息的个数，点击跳转到message页面 在显示其内容
            Message.getMessageCount(current_user._id, function(err, messages) {
                if (err) {
                    return next(err);
                }
                messages = messages || 0;
                proxy.emit('messages', messages);
            });
            Joke.getJokesCountByQuery({}, function(err, pages_count) {
                if (err) {
                    return next(err);
                }
                var pages = Math.ceil(pages_count/limit);
                proxy.emit('pages', pages);
            });
        });
    } else {
        var render = function(recent_jokes, pages) {
            res.render('index', {
                config: config,
                current_user: current_user,
                recent_jokes: recent_jokes,
                pages: pages,
                limit: limit
            });
        }
        var proxy = new EventProxy.create('recent_jokes','pages', render);
        //查询jokes 分页
        var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};
        Joke.getJokesByQuery({}, options, function(recent_jokes) {
            proxy.assign('user_save', recent_jokes.length, function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('recent_jokes', recent_jokes);
            });
            if (recent_jokes.length > 0) {
                recent_jokes.forEach(function(joke) {
                    User.getUserById(joke.author_id, function(err, user) {
                        if (err) {
                            return next(err);
                        }
                        joke.user = user;
                        proxy.emit('user_save', joke);
                    });
                });
            } else {
                proxy.emit('recent_jokes', recent_jokes);
            }
        });
        Joke.getJokesCountByQuery({}, function(err, pages_count) {
            if (err) {
                return next(err);
            }
            var pages = Math.ceil(pages_count/limit);
            proxy.emit('pages', pages);
        });
    }
}