/**
 * Created by nicholas_xue on 14-3-30.
 */

var config = require('../config');
var Joke = require('../proxy').Joke;
var validator = require('validator');
var User = require('../proxy').User;
var ndir = require('ndir');
var path = require('path');
var fs = require('fs');
var EventProxy = require('eventproxy');
/**
 * 发表joke
 * @param req
 * @param res
 * @param next
 */
exports.createJoke = function(req, res, next) {
    if (!req.session.user) {
        res.render('notify/notify', {
            config: config,
            error: '请先登录'
        });
        return;
    }
    User.getUserById(req.session.user._id, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!req.body.content && !req.body.link && !req.files && !req.files.pictures) {
            res.render('index', {
                error: '至少选择一项分享',
                config: config
            });
            return;
        }
        var content = validator.trim(req.body.content.toString());
        var link = validator.trim(req.body.link.toString());
        var pictures = [];//将上传的图片路径保存在此数组中
        if (req.files && req.files.pictures) {
            //当只上传一个文件时，req.files.pictures为Object类型，不能用forEach,当上传多个文件时，就变为Array类型
            //需要在做一下判断
            var upload_pics = req.files.pictures;
            var picDir = path.join(config.upload_pictures_dir, Date.now().toString());
            if (upload_pics.length > 1) {
                upload_pics.forEach(function(picture) {
                    ndir.mkdir(picDir, function(err) {
                        if (err) {
                            return next(err);
                        }
                        var filename = Date.now() + '_' + picture.name;
                        var savepath = path.resolve(path.join(picDir, filename));
                        var pic_url = config.site_static_host + '/upload_pics/pictures/' + filename;
                        pictures.push(pic_url);
                        fs.rename(picture.path, savepath, function(err) {
                            if (err) {
                                return next(err);
                            }
                        });
                    });
                });
            } else {
                ndir.mkdir(picDir, function(err) {
                    if (err) {
                        return next(err);
                    }
                    var filename = Date.now() + '_' + upload_pics.name;
                    var savepath = path.resolve(path.join(picDir, filename));
                    var pic_url = config.site_static_host + '/upload_pics/pictures/' + filename;
                    pictures.push(pic_url);
                    fs.rename(upload_pics.path, savepath, function(err) {
                        if (err) {
                            return next(err);
                        }
                    });
                });
            }

            Joke.newAndSave(user._id, content, pictures, link, function(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        } else {
            Joke.newAndSave(user._id, content, pictures, link, function(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        }
    });

}