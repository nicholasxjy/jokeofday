var model = require('../models');
var LikeRelation = model.LikeRelation;

exports.getLikeRelationByJokeId = function(jokeid, callback) {
	LikeRelation.find({joke_id: jokeid}, {}, {}, callback);
}


exports.removeLikeRelationByQuery = function(query, callback) {
	LikeRelation.remove(query, callback);
}

exports.newAndSave = function(jokeid, userid, callback) {
	var likerelation = new LikeRelation();
	likerelation.joke_id = jokeid;
	likerelation.user_id = userid;
	likerelation.save(callback);
}