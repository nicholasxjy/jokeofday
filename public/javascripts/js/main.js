
function likeSuccess(data) {
    if (data.status === 'success') {
        var likes = $(this).next().text();
        if ($(this).attr('title') === 'plus one') {
            $(this).next().text() = parseInt(likes) + 1;
            $(this).attr('title', 'sub one');
        } else {
            if (likes > 0) {
                $(this).next().text() = parseInt(likes) - 1;
            } else {
                $(this).next().text() = 0;
            }
            $(this).attr('title', 'plus one');
        }
    } else {
        alert('something wrong');
    }
}
$(document).ready(function() {
    $('.btn-plus-like').click(function() {
        var isPlus = (this.title === 'plus one');
        var jokeId = this.id;
        $.post('/joke/like-or-not', {'isPlus': isPlus, 'jokeId': jokeId}, likeSuccess(data), 'json');
    });
});


