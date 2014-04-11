/**
 * Created by nicholas_xue on 14-3-24.
 */
var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Relation = require('../proxy').Relation;
var Message = require('../proxy').Message;
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
                config: config,
            });
            return;
        }
        //接下来 要根据此user查出该user的 未读message数量 关注几个人 被关注几人  最近发表的joke
        //此处需要 eventproxy，不然会嵌套太深，掉坑里。
        //npm new package
        var isUser = false;//判断访问的是否是自己
        if (req.session.user) {
            if (req.session.user._id.toString() === user._id.toString()) {
                isUser = true;
            }
        }
        var render = function(recent_jokes, relation, messages) {
            res.render('user/index', {
                user: user,
                config:config,
                recent_jokes: recent_jokes,
                relation: relation,
                messages: messages,
                isUser: isUser
            });
        };
        var proxy = new EventProxy();
        proxy.assign('recent_jokes', 'relation', 'messages', render);
        proxy.fail(next);

        var query = {author_id:user._id};
        var opts = {limit: 5, sort:{create_at:'desc'}};
        Joke.getJokesByQuery(query, opts, proxy.done('recent_jokes'));

        if (!req.session.user) {
            proxy.emit('relation', null);
        } else {
            //获取 user 和req.session.user的关注关系，user是通过url的name参数获得的，而req.session.user是当前登录用户
            //也就是说当前登录用户，去查看别的用户主页
            Relation.getRelation(user._id, req.session.user._id, proxy.done('relation'));//此处是为了前端显示 关注还是取消关注
        }
        Message.getMessageCountByUserId(user._id, proxy.done('messages'));
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
/**
 * 用户setting信息
 * @param req
 * @param res
 * @param next
 */
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
        if (profileimage.name !== '') {
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
};
/**
 * 用户之间的 关注 取消等操作
 * @param req
 * @param res
 * @param next
 */
exports.addFollow = function(req, res, next) {
    if (!req.session.user) {
        res.json({status: 'failed', error: '请先登录'});
        return;
    }
    var user = req.session.user;
    var follow_userid = req.body.userid;
    var action = req.body.action;
    var count = 0;
    var render = function() {
        res.json({status: 'success', count: count});
    };
    var proxy = EventProxy.create('relation_save', 'followed_save', 'following_save', render);
    proxy.fail(next);
    if (action === 'add-follow') {
        Relation.newAndSave(follow_userid, user._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('relation_save');
        });
        User.getUserById(follow_userid, function(err, doc) {
            if (err) {
                return next(err);
            }
            doc.follower_count = parseInt(doc.follower_count) + 1;
            count = parseInt(doc.follower_count);
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('followed_save');
            });
        });
        User.getUserById(user._id, function(err, doc) {
            if (err) {
                return next(err);
            }
            doc.following_count = parseInt(doc.following_count) + 1;
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('following_save')
            });
        });
    } else {
        Relation.removeRelation(follow_userid, user._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('relation_save');
        });
        User.getUserById(follow_userid, function(err, doc) {
            if (err) {
                return next(err);
            }
            if (parseInt(doc.follower_count) > 0) {
                doc.follower_count = parseInt(doc.follower_count) - 1;
            } else {
                doc.follower_count = 0;
            }
            count = parseInt(doc.follower_count);
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('followed_save');
            });
        });
        User.getUserById(user._id, function(err, doc) {
            if (err) {
                return next(err);
            }
            if (parseInt(doc.following_count) > 0) {
                doc.following_count = parseInt(doc.following_count) - 1;
            } else {
                doc.following_count = 0;
            }
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('following_save')
            });
        });
    }
};
/**
 * 根据用户名获得其粉丝信息
 * @param req
 * @param res
 * @param next
 */
exports.getMyFans = function(req, res, next) {
    var username = req.params.username;
    if (!username) {
        res.render('notify/notify', {
            error: '信息有误',
            config: config
        });
        return;
    }
    var fansids = [];
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        Relation.getFansByUserId(user._id, function(err, docs) {
            if (docs && docs.length > 0) {
                for(var i = 0; i < docs.length; i++) {
                    fansids.push(docs[i].follow_id);
                }
                User.getUsersByIds(fansids, function(err, fans) {
                    if (err) {
                        return next(err);
                    }
                    res.render('user/fans', {
                        config: config,
                        fans: fans
                    });
                });
            } else {
                res.render('user/fans', {
                    config: config,
                    fans: []
                })
            }
        });
    });
};
/**
 * 根据用户 获得其关注人
 * @param req
 * @param res
 * @param next
 */
exports.getFollowings = function(req, res, next) {
    var username = req.params.username;
    if (!username) {
        res.render('notify/notify', {
            error: '信息有误',
            config: config
        });
        return;
    }
    var followids = [];
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        Relation.getFollowingsByUserId(user._id, function(err, docs) {
            if (docs && docs.length > 0) {
                for(var i = 0; i < docs.length; i++) {
                    followids.push(docs[i].user_id);
                }
                User.getUsersByIds(followids, function(err, followings) {
                    if (err) {
                        return next(err);
                    }
                    res.render('user/followings', {
                        config: config,
                        followings: followings
                    });
                });
            } else {
                res.render('user/followings', {
                    config: config,
                    followings: []
                });
            }
        });
    });
};


