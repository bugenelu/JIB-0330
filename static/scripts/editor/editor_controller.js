// Ajax script for editor stuff

// editor = new Editor();
current_story = null;
all_story_ids = []

$.get('/editor/get_all_stories', function(event, status) {
    console.log(event)
    console.log(status)
    // all_story_ids = event;
    if (status == 'success') {
        // Success
        all_story_ids = event['list']
        var pagelist = document.getElementById('storage');
        for (let i = 0; i < event['list'].length; i++) {
            var b = document.createElement("button");
            b.innerHTML = event['list'][i];
            b.setAttribute('id', event['list'][i]);
            b.setAttribute('class', 'storybox');

            pagelist.appendChild(b);
        }
    }
});

// Opening a Story
// expecting <button id='replace-me-with-open-button' story_id='story_id'></button>
$(".storybox").click(function(e)  {
    alert("button clicked");
    $.get('/editor/open_story/' + e.target.id, function(story_data, status) {
        if (status == 'success') {
            // Success
            current_story = story_data;
        } else {
            // Failure
            current_story = null;
        }

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
