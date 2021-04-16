editor = new Editor();
current_story = null;
all_story_ids = []
open_story_list = [] // names of the open stories

open_story_btn = null;
all_page_ids = null;

$.get('/editor/get_all_stories', function(event, status) {
    if (status == 'success') {
        // Success
        console.log('Success');
        all_story_ids = event['list'];
        var savedstories = document.getElementById("test");

        var b2 = document.createElement("button");
        b2.innerHTML = "Select An Engine To Change Live Engine";
        b2.setAttribute('id', 'set_engine_button');
        b2.classList.add('unclickable');
        b2.classList.add('disarmed');
        savedstories.appendChild(b2);
        savedstories.appendChild(document.createElement("br"));

        for (let i = 0; i < event['story_id'].length; i++) {
            var b = document.createElement("button");
            b.innerHTML = event['story_name'][i];
            b.setAttribute('id', event['story_id'][i]);
            b.setAttribute('class', 'displayed_story');
            // b.setAttribute('class', 'unclickable');
            savedstories.appendChild(b);
        }
    }
});

$.get('/editor/view_live_story', function(event, status) {
    if (status == 'success') {
        live_story = event['list']
        var live_engine_display = document.getElementsByClassName("live_engine_display")[0];
        var b = document.createElement("button");
        b.innerHTML = live_story;
        b.setAttribute('class', 'unclickable');
        b.setAttribute('id', 'live_story_display');
        live_engine_display.appendChild(b);
    }
});

$(".saved_engines").on("click", ".displayed_story", function(e) {
    var set_engine = document.getElementById("set_engine_button");
    set_engine.innerHTML = "Set Live Engine To " + e.target.innerHTML;
    set_engine.setAttribute('engine_name', e.target.innerHTML);
    set_engine.classList.remove('unclickable');
    set_engine.classList.remove('disarmed');
    set_engine.classList.add('armed');
});

$(".saved_engines").on("click", "#set_engine_button", function(e) {
    var live_story = document.getElementById('live_story_display');
    var old_live_story = live_story.innerHTML;

    if (confirm("REMINDER: The selection for Live Engine determines what content users will see when creating their stories. This is a global setting for all users of the Knowledge Hub. Are you ready to change the Live Engine?")) {
        var new_live_story = e.target.getAttribute('engine_name');
        live_story.innerHTML = new_live_story;

    } else {
        var new_live_story = old_live_story;
    }

    $.post("/editor/update_live_story", 
    {
        'new_live_story': new_live_story,
    },
    function(data, status) {
        if (status == "success") {
            console.log("Update successful");
        } else {
            console.log("Update not successful");
        }
    })

    e.target.innerHTML = "Select An Engine To Change Live Engine";
    e.target.classList.remove('armed');
    e.target.classList.add('unclickable');
    e.target.classList.add('disarmed');
});