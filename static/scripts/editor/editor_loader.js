editor = new Editor();
current_story = null;
all_story_ids = []
open_story_list = [] // names of the open stories

open_story_btn = null;
all_page_ids = null;

$.get('/editor/load_all_stories', function(event, status) {
    if (status == 'success') {
        // Success
        console.log('Success');
        all_story_ids = event['list'];
        var savedstories = document.getElementById("test");
        for (let i = 0; i < event['list'].length; i++) {
            var b = document.createElement("button");
            b.innerHTML = event['list'][i];
            b.setAttribute('id', event['list'][i]);
            b.setAttribute('class', 'unclickable');
            savedstories.appendChild(b);
        }
    }
});

$.get('/editor/view_live_story', function(event, status) {
    if (status == 'success') {
        live_story = event['list']
        var div3 = document.getElementsByClassName("div3")[0];
        var b = document.createElement("button");
        b.innerHTML = live_story;
        b.setAttribute('class', 'unclickable');
        div3.appendChild(b);
    }
});