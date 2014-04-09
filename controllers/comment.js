var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Comment = require('../proxy').Comment;
var Message = require('../proxy').Message;
var EventProxy = require('eventproxy');

exports.addComment = function(req, res, next) {
    if (!req.session.user) {
        res.json({status: 'failed', error: '请先登录!'});
    }
    var user = req.session.user;
    var jokeid = req.body.jokeid;
    var content = req.body.content;

    var proxy = EventProxy.create('new_comment', 'new_message', function() {
       res.json({status: 'success', jokeid: jokeid, content: 'content'});
    });
    proxy.fail(next);
    Joke.getJokeById(jokeid, function(err, joke, author, comments) {
        if (err) {
            return next(err);
        }
        if (!joke) {
            res.json({status: 'failed', error: '信息有误!'});
        }
        Comment.newAndSave(content, jokeid, user._id, author._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('new_comment');
        });
        Message.newAndSave('new comment', author._id, user._id, jokeid, author._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('new_message');
        });
    });
}