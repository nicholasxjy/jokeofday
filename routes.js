var config = require('./config');

var site = require('./controllers/site');
var sign = require('./controllers/sign');



module.exports = function(app) {
    //home page
    app.get('/', site.index);

    //account manage,signup signin
    //在此判断是否可以注册
    if (config.allowed_sign_up) {
        app.get('/signup', sign.showSignup);
        app.post('/signup', sign.signup);
    } else {
        //TODO这里或许可以允许第三方登陆,like weibo
    }

    app.get('/signin', sign.showSignin);
    app.post('/signin', sign.signin);

    app.get('/signout', sign.signout);

    //password reset
    app.get('/forgot-password', sign.showForgotPassword);
    app.post('/forgot-password', sign.findPassword);

}
