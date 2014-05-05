$(document).ready(function() {
    $('#message-tooltip').tooltip();


    //show comment
    $('#add-a-comment').focus(function() {
        $('#add-a-comment').hide();
        $('#comment-show').show();
        $('#new-comment-content').focus();
    });
    $('#cancel-post-comment').click(function() {
        $('#comment-show').hide();
        $('#add-a-comment').show();
    });
    
    $("#new-comment-content").keyup(function() {
        if (this.value !== '') {
            $("#post-comment").removeAttr('disabled');
        } else {
            $("#post-comment").attr('disabled', 'disabled');
        }
    });
    // add comment
    $('#post-comment').click(function() {
        var jokeid = $('#joke-info-id').val();
        var content = $('#new-comment-content').val();
        $.post('/comment/add-comment', {'jokeid': jokeid, 'content': content}, function(data) {
            if (data.status === 'success') {
                var html = '<li><a href="/user/'+ data.user.name +'"><img src="'+ data.user.profile_image_url +'" alt="<%= comment.author.name %>"width="20" height="20" class="img-responsive pull-left"/></a><a href="/user/'+ data.user.name +'" class="pull-left comment-author-name">'+ data.user.name +'&nbsp;</a><span class="pull-left">:&nbsp;'+ data.content +'</span><span class="pull-left comment-time">&nbsp;&nbsp;on just now</span></li>';
                $('#comments-list').prepend(html);
                $('#comments-count').html(data.comment_count);
                $('#new-comment-content').val('');
                $('#comments-list').prev('h3').removeClass('alert').removeClass('alert-success').html('Comments');
                $('#post-comment').attr('disabled', 'disabled');
                $('#comment-show').hide();
                $('#add-a-comment').show();
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
    // remove disabled if content is not null
    $('#content').keyup(function() {
       if (this.value !== '') {
           $('#btn-post-photos').removeAttr('disabled', 'disabled');
       }
    });

    //return to top
    $('#btt').click(function(){
        var pos = $('#btt').offset();
        if(pos) {
            $('html, body').animate({
                scrollTop:0
            }, 1500)
        }

    });
});


