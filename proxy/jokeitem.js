/**
 * Created by nicholas_xue on 14-3-24.
 */
var model = require('../models');
var Joke = model.Joke;
/**
 * 根据关键字 查找一组jokeitem
 * @param query
 * @param opts
 * @param callback
 */
exports.getJokesByQuery = function(query, opts, callback) {
    Joke.find(query, {}, opts, callback);
}
/**
 * 新增joke
 * @param authotid
 * @param content
 * @param pictures
 * @param link
 * @param callback
 */
exports.newAndSave = function(authotid, content, pictures, link, callback) {
    var joke = new Joke();
    joke.author_id = authotid;
    joke.content = content;
    joke.pictures = pictures;
    joke.link = link;
    joke.save(callback);
}