editor = new Editor();
current_story = null;
all_story_ids = []
open_story_list = [] // names of the open stories

open_story_btn = null;
all_page_ids = null;

$.get('/editor/get_all_stories', function(event, status) {
    if (status == 'success') {
        // Success
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

        delete_btn = document.createElement('button');
        delete_btn.innerHTML = 'Select An Engine to Delete'
        delete_btn.classList.add('unclickable')
        delete_btn.classList.add('disarmed')
        delete_btn.id = 'delete_engine_btn';
        savedstories.appendChild(document.createElement('br'))
        savedstories.appendChild(delete_btn)
    }
});

$.get('/editor/view_live_story', function(event, status, response) {
    console.log(event);
    console.log(response);
    if (status == 'success') {
        live_story = response['responseJSON']['story_id']
        live_name = response['responseJSON']['story_name']
        var live_engine_display = document.getElementsByClassName("live_engine_display")[0];
        var b = document.createElement("button");
        b.innerHTML = live_name;
        b.setAttribute('class', 'unclickable');
        b.setAttribute('id', 'live_story_display');
        live_engine_display.appendChild(b);
    }
});

$(".saved_engines").on("click", ".displayed_story", function(e) {
    var set_engine = document.getElementById("set_engine_button");
    set_engine.innerHTML = "Set Live Engine To " + e.target.innerHTML;
    set_engine.setAttribute('engine_id', e.target.id);
    set_engine.setAttribute('engine_name', e.target.innerHTML);
    set_engine.classList.remove('unclickable');
    set_engine.classList.remove('disarmed');
    set_engine.classList.add('armed');

    var delete_engine = document.getElementById('delete_engine_btn');
    delete_engine.innerHTML = 'Delete Live Engine ' + e.target.innerHTML;
    delete_engine.setAttribute('engine_id', e.target.id);
    delete_engine.setAttribute('engine_name', e.target.innerHTML);
    delete_engine.classList.remove('unclickable');
    delete_engine.classList.remove('disarmed');
    delete_engine.classList.add('armed');
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
        'new_live_story': e.target.getAttribute('engine_id'),
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

    delete_engine = document.getElementById('delete_engine_btn');
    delete_engine.classList.remove('armed');
    delete_engine.classList.add('unclickable');
    delete_engine.classList.add('disarmed');
});

$('.saved_engines').on('click', '#delete_engine_btn', function(e) {
    e.target.innerHTML = "Select An Engine To Change Live Engine";
    e.target.classList.remove('armed');
    e.target.classList.add('unclickable');
    e.target.classList.add('disarmed');

    e.target.innerHTML = "Select An Engine To Change Live Engine";
    e.target.classList.remove('armed');
    e.target.classList.add('unclickable');
    e.target.classList.add('disarmed');

    update_live = document.getElementById('set_engine_button');
    update_live.classList.remove('armed');
    update_live.classList.add('unclickable');
    update_live.classList.add('disarmed');

    delete_engine = document.getElementById('delete_engine_btn');
    delete_engine.classList.remove('armed');
    delete_engine.classList.add('unclickable');
    delete_engine.classList.add('disarmed');

    delete_story = e.target.getAttribute('engine_id');
    delete_name = e.target.getAttribute('engine_name');
    
    delete_confirm = prompt('Enter Engine Name to Delete: ' + delete_name);
    if (delete_confirm == delete_name) {
        $.post("/editor/delete_engine", 
        {
            'engine_id': delete_story,
        },
        function(data, status, response) {
            if (status == "success") {
                if (response['responseJSON']['success']) {
                    alert('Engine Successfully Deleted');
                    remove_engine = document.getElementById(delete_story);
                    remove_engine.parentElement.removeChild(remove_engine);
                } else {
                    alert('Cannot delete live story');
                }
            } else {
                alert('Engine Failed to Delete');
            }
        });
    } else {
        alert('Name entered does not match. Engine not deleted.');
    }
});