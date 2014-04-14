$(document).ready(function() {

    var msnry = new Masonry('#container', {
        "itemSelector": '.item',
        "columnWidth": 255,
        "gutter": 30
    });

    //add or cancel plus one
    $('.btn-plus-like').click(function() {
        var isPlus = (this.title === 'plus one');
        var jokeId = this.id;
        $.post('/joke/like-or-not', {'isPlus': isPlus, 'jokeId': jokeId}, function(data) {
            if (data.status === 'success') {
                var $btn = $('#'+ data.id);
                if ($btn.attr('title') === 'plus one') {
                    $btn.attr('title', 'sub one');
                    $btn.css('color', '#f64c3f');
                    $btn.find('span').html(data.likes);
                } else {
                    $btn.attr('title', 'plus one');
                    $btn.css('color', '#8d8d8d');
                    $btn.find('span').html(data.likes);
                }
            } else {
                if (data.error) {
                    alert(data.error);
                }
            }
        }, 'json');
    });

    //show comment
    $('.show-comment').click(function() {
       var index = $(this).attr('index');
        $('#joke-comment-'+index).show();
    });

    // add comment
    $('.btn-add-comment').click(function() {
        var jokeid = $(this).attr('title');
        var content = $(this).prev('input').val();
        var btn = $(this);
        var index = $(this).attr('index');
        $.post('/comment/add-comment', {'jokeid': jokeid, 'content': content}, function(data) {
            if (data.status === 'success') {
                var html = "<div>"+ data.content + "<span> created by "
                + data.user.name +" on 刚刚</span></div>";
                $('.joke-comment-'+index).prepend(html);
                btn.prev('input').val('');
                $('#'+ data.jokeid).next('strong').next('strong').html(data.views);
            } else {
                alert(data.error);
            }
        }, 'json');
    });

    // add or cancel follow
    $('.btn-follow').click(function() {
        var action = $(this).attr('action');
        var userid = this.id;
        var btn = $(this);
        $.post('/user/follow', {'action': action, 'userid': userid}, function(data) {
            if (data.status === 'success') {
                $('#fans').html(data.count);
                if (action === 'add-follow') {
                    btn.removeClass('btn-success').addClass('btn-default');
                    btn.html('取消关注');
                    btn.attr('action', 'cancel-follow');
                } else {
                    btn.removeClass('btn-default').addClass('btn-success');
                    btn.html('加入关注');
                    btn.attr('action', 'add-follow');
                }
            } else {
                alert(data.error);
            }
        }, 'json');
    });
});


