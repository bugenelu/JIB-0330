// Ajax script for editor stuff

// TODO: List of things to do
// - Keep track of page on for story
// - List of functions 

// - List of editor class

// [[string, function], ...]
// - popup
//     - z-index for "Open" new story

// changing live story


editor = new Editor();
current_story = null;
all_story_ids = []

open_story_btn = null;

$.get('/editor/get_all_stories', function(event, status) {
    // all_story_ids = event;
    if (status == 'success') {
        // Success
        all_story_ids = event['list']
        var pagelist = document.getElementsByClassName('popup')[0];
        for (let i = 0; i < event['list'].length; i++) {
            var b = document.createElement("button");
            b.innerHTML = event['list'][i];
            b.setAttribute('id', event['list'][i]);
            b.setAttribute('class', 'open_story');

            pagelist.appendChild(b);
        }
    }
});

function get_story_data(e) {
    $.get('/editor/open_story/' + e.target.id, function(story_data, status) {
        if (status == 'success') {
            // Success
            current_story = story_data;
        } else {
            // Failure
            current_story = null;
        }

        if (open_story_btn != null) {
            open_story_btn.style.background='#8DD883';
        }

        open_story_btn = e.target;
        open_story_btn.style.background = 'rgba(255, 255, 255, 0.90)';

        // Update Page <-- Work with Joseph
        var button = e.target;
        var text = button.innerHTML + " Metadata: ";
        var num_pages = Object.keys(current_story['page-nodes']).length
        text = text + "id=" + button.id + ", \nroot=" + current_story['root-name'] + ",\nname=" + current_story["story-name"] + ", \n#pages=" + num_pages;
        document.getElementById("metadata").innerHTML = text;
        
        // Use page-ids for now, change to page-names later
        var pagelist = document.getElementById("page-list");
        while (pagelist.firstChild) {
            pagelist.removeChild(pagelist.firstChild);
        }
        var header = document.createElement("h1");
        var header = document.createElement("h1");
        header.innerHTML = "Page List";
        pagelist.appendChild(header);

        var all_page_ids = Object.keys(current_story['page-nodes'])
        for (let i = 0; i < num_pages; i++) {
            var b = document.createElement("button");
            b.innerHTML = all_page_ids[i];
            pagelist.appendChild(b);
        }
    })
}

// Opening a Story
// expecting <button id='replace-me-with-open-button' story_id='story_id'></button>
$(".storybox").click(function(e)  {
    get_story_data(e);
});

$(".div5").on("click", ".storybox", function(e) {
    get_story_data(e);
});

$(".popup").on("click", ".open_story", function(e) {
    var new_btn = document.createElement("button");
    new_btn.innerHTML = e.target.innerHTML;
    new_btn.setAttribute('class', 'storybox');
    new_btn.setAttribute('id', e.target.id);
    new_btn.click();

    var story_list = document.getElementById("storage");
    var add_btn = document.getElementById("+");
    story_list.removeChild(add_btn);

    document.getElementById("storage").appendChild(new_btn);
    document.getElementById("storage").appendChild(add_btn);
    // e.target.style.display = "none";
    document.getElementById('popup-box').style.display = "none";
});


// Saving a Story
$("replace-me-with-save-button").click(function(e) {
    $.post("/editor/save_story/" + e.target.story_id, 
    {
        story_data: null, // replace this later with function to get the current story edits
    },
    function(data, status) {
        if (status == 200) {
            alert("Story successfully saved");
        } else {
            alert("Story did not save successfully");
        }
    })
});

$(".add_storybox").click(function(e) {
    var popup = document.getElementById("popup-box");
    var hidden = popup.style.display == 'none';

    if (hidden) {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
});