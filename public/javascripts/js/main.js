$(document).ready(function() {
    //add or cancel plus one
    $('.btn-plus-like').click(function() {
        var isPlus = (this.title === 'plus one');
        var jokeId = this.id;
        $.post('/joke/like-or-not', {'isPlus': isPlus, 'jokeId': jokeId}, function(data) {
            if (data.status === 'success') {
                var $btn = $('#'+ data.id);
                if ($btn.attr('title') === 'plus one') {
                    $btn.attr('title', 'sub one');
                    $btn.removeClass('btn-primary');
                    $btn.addClass('btn-danger');
                    $btn.html('-1');
                } else {
                    $btn.attr('title', 'plus one')
                    $btn.removeClass('btn-danger');
                    $btn.addClass('btn-primary');
                    $btn.html('+1');
                }
                $btn.next('strong').html(data.likes);
                $btn.next('strong').next('strong').html(data.views);
            } else {
                if (data.error) {
                    alert(data.error);
                }
            }
        }, 'json');
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
});


