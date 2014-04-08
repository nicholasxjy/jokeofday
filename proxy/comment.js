/**
 * Created by nicholas_xue on 14-4-7.
 */
var model = require('../models');
var Comment = model.Comment;
var EventProxy = require('eventproxy');
var User = require('./user');
var Util = require('../libs/util');
/**
 * 根据每条jokeid 获取其对应的评论  以及评论作者和评论对象
 * @param jokeid
 * @param callback
 */
exports.getCommentsByJokeId = function(jokeid, callback) {
    Comment.find({joke_id: jokeid}, {}, {sort: {create_at: 'desc'}}, function(err, comments) {
        if (err) {
            return callback(err);
        }
        if (comments && comments.length === 0) {
            return callback(null, []);
        }
        //var allcomments = [];
        var proxy = new EventProxy();
        proxy.after('comment_save', comments.length, function(allcomments) {
            return callback(null, allcomments);
        });
        proxy.fail(callback);
        for(var i = 0; i < comments.length; i++) {
            var ep = EventProxy.create('author_save', 'touser_save', function() {
                proxy.emit('comment_save', comments[i]);
            });
            User.getUserById(comments[i].author_id, function(author) {
                comments[i].author = author;
                comments[i].friendly_create_time = Util.formatDate(comments[i].create_at, true);
                ep.emit('author_save', comments[i]);
            });
            User.getUserById(comments[i].reply_to_id, function(touser) {
                comments[i].touser = touser;
                ep.emit('touser_save', comments[i]);
            });
        }
    });
};

/**
*
*/
exports.newAndSave = function(content, joke_id, author_id, reply_to_id, callback) {
    var comment = new Comment();
    comment.content = content;
    comment.joke_id = joke_id;
    comment.author_id = author_id;
    comment.reply_to_id = reply_to_id;
    comment.save(callback);
}