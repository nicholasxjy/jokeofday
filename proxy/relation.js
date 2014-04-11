/**
 * Created by nicholas_xue on 14-3-24.
 */
var model = require('../models');
var Relation = model.Relation;
/**
 * 根据两用户id查找他们的关系
 * @param {ID} userId 被关注人
 * @param {ID} followId 关注人
 * @param callback
 */
exports.getRelation = function(userId, followId, callback) {
    Relation.findOne({user_id: userId, follow_id:followId}, callback);
}

exports.removeRelation = function(userId, followId, callback) {
	Relation.remove({user_id: userId, follow_id:followId}, callback);
}


exports.newAndSave = function(userId, followId, callback) {
	var relation = new Relation();
	relation.user_id = userId;
	relation.follow_id = followId;
	relation.save(callback);
}