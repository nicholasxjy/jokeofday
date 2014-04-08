/**
 * Created by nicholas_xue on 14-3-30.
 */

var config = require('../config');
var Joke = require('../proxy').Joke;
var validator = require('validator');
var User = require('../proxy').User;
var Message = require('../proxy').Message;
var ndir = require('ndir');
var path = require('path');
var fs = require('fs');
var EventProxy = require('eventproxy');



exports.showCreate = function(req, res, next) {
    res.render('joke/create', {
        user: req.session.user,
        config: config
    });
}
/**
 * 发表joke
 * @param req
 * @param res
 * @param next
 */
exports.createJoke = function(req, res, next) {
    if (!req.session.user) {
        res.render('joke/create', {
            config: config,
            error: '请先登录'
        });
        return;
    }
    User.getUserById(req.session.user._id, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!req.body.content && !req.body.link && req.files.pictures.name === '') {
            res.render('joke/create', {
                error: '至少选择一项分享',
                config: config
            });
            return;
        }
        var content = validator.trim(req.body.content.toString());
        var link = validator.trim(req.body.link.toString());
        //当只上传一个文件时，req.files.pictures为Object类型，不能用forEach,当上传多个文件时，就变为Array类型
        //需要在做一下判断
        var upload_pics = req.files.pictures;

        var pictures = []; //将上传的图片保存在此数组

        var proxy = new EventProxy();
        var render = function() {
            Joke.newAndSave(user._id, content, pictures, link, function(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
                return;
            });

        }
        var dateStamp = Date.now().toString();
        var picDir = path.join(config.upload_pictures_dir, dateStamp, user.name);
        if (upload_pics.length > 1) {
        proxy.after('picture_done', upload_pics.length, render);
            ndir.mkdir(picDir, function(err) {
                if (err) {
                    return next(err);
                }
                upload_pics.forEach(function(picture, i) {
                    var filename = Date.now() + '_' + picture.name;
                    var savepath = path.resolve(path.join(picDir, filename));
                    var pic_url = config.site_static_host + '/upload_pics/pictures/'+dateStamp+'/'
                        +user.name+'/' + filename;
                    picture.url = pic_url;
                    pictures[i] = picture;
                    fs.rename(picture.path, savepath, function(err) {
                        if (err) {
                            return next(err);
                        }
                        proxy.emit('picture_done');
                    });
                });
            });
        } else {
            proxy.assign('joke_saved', render);
            if (upload_pics.name !== '') {
                ndir.mkdir(picDir, function(err) {
                    if (err) {
                        return next(err);
                    }
                    var filename = Date.now() + '_' + upload_pics.name;
                    var savepath = path.resolve(path.join(picDir, filename));
                    var pic_url = config.site_static_host + '/upload_pics/pictures/'+dateStamp+'/'
                        +user.name+'/' + filename;
                    upload_pics.url = pic_url;
                    pictures[0] = upload_pics;
                    fs.rename(upload_pics.path, savepath, function(err) {
                        if (err) {
                            return next(err);
                        }
                        proxy.emit('joke_saved');
                    });
                });
            } else {
                proxy.emit('joke_saved');
            }
        }
    });
};


exports.plusOne = function(req, res, next) {
    var user = req.session.user;
    var isPlus = req.body.isPlus;
    var jokeid = req.body.jokeId;
    var likes = 0;
    Joke.getJokeById(jokeid, function(err, joke, author, comments) {
        if (err) {
            return next(err);
        }
        if (!joke) {
            res.json({status: 'failed'});
        }
        //如果是点赞操作，此处做两件事 发信息提醒joke作者有人点赞(即保存信息)  joke的like_count++
        //如果是取消赞， 只需like_count--,不提醒了
        var render = function() {
            res.json({status: 'success', id: joke._id, likes: likes});
        }

        if (isPlus === 'true') {
            var proxy = EventProxy.create('message_save', 'joke_save', render);
            proxy.fail(next);
            Message.newAndSave('add like', author._id, user._id, joke._id, joke.author_id, function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('message_save');
            });
            joke.like_count = joke.like_count + 1;
            likes = joke.like_count;
            joke.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('joke_save');
            });

        } else {
            var proxy = EventProxy.create('joke_save', render);
            if (joke.like_count > 0) {
                joke.like_count = joke.like_count - 1;
            } else {
                joke.like_count = 0;
            }
            likes = joke.like_count;
            joke.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('joke_save');
            });

        }
    });
}