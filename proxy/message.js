var Message = require('../models').Message;

/**
 * 根据用户id查出该用户未读的信息个数
 * @param id
 * @param callback
 */
exports.getMessageCount = function(id, callback) {
    Message.count({masterid:id, has_read:false}, callback);
}