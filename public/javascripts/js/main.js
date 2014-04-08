$(document).ready(function() {
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
                } else {
                    $btn.attr('title', 'plus one')
                    $btn.removeClass('btn-danger');
                    $btn.addClass('btn-primary');
                }
                $btn.next('strong').html(data.likes);
            }
        }, 'json');
    });
});


