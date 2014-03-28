/**
 * Created by nicholas_xue on 14-3-24.
 */
var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Relation = require('../proxy').Relation;
var EventProxy = require('eventproxy');
var validator = require('validator');
var fs = require('fs');
var ndir = require('ndir');
var path = require('path');
/**
 * 用户主页
 * @param req
 * @param res
 * @param next
 */
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
        var opts = {limit: 5, sort:{create_at:'desc'}};
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
/**
 * 显示settings页面，必须登录
 * @param req
 * @param res
 * @param next
 */
exports.showSettings = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('home');
        return;
    }
    User.getUserById(req.session.user._id, function(err, user) {
        if (err) {
            return next(err);
        }
        if (req.query.save === 'success') {
            user.success = "保存成功";
        }
        user.error = null;
        return res.render('user/settings', {
            user: user,
            config: config
        });
    });
};

exports.settings = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    var gender = req.body.gender;
    var location = validator.trim(req.body.location.toString());
    var profile = validator.trim(req.body.profile.toString());
    var profileimage = req.files.thumbnail;
    User.getUserById(req.session.user._id, function(err, user) {
        user.gender = gender;
        user.location = location;
        user.profile = profile;
        //这里修改头像，将上传图片经过处理的url赋给profile-image-url
        //图片的路径赋值为uid/date.now+file.name
        if (req.files && profileimage) {
            var uid = user._id.toString();
            var userDir = path.join(config.upload_dir, uid);
            ndir.mkdir(userDir, function(err) {
                if (err) {
                    return next(err);
                }
                var filename = Date.now() + '_' + profileimage.name;
                var savepath = path.resolve(path.join(userDir, filename));
                user.profile_image_url = config.site_static_host + '/userprofile/images/'+uid+'/'+filename;
                fs.rename(profileimage.path, savepath, function(err) {
                    if (err) {
                        return next(err);
                    }
                    user.save(function(err) {
                        if (err) {
                            return next(err);
                        }
						return res.redirect('/settings?save=success');
                    });
                });
            });
        } else {
            if (user.profile_image_url) {
                user.profile_image_url = user.profile_image_url;
            }
            user.save(function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/settings?save=success');
            });
        }

    });
}
