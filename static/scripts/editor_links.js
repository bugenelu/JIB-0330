// Ajax script for editor stuff

editor = new Editor();
current_story = null;

// Opening a Story
// expecting <button id='replace-me-with-open-button' story_id='story_id'></button>
$("replace-me-with-open-button").click(function(e)  {
    $.get('/editor/open_story/' + e.target.story_id, function(story_data, status) {
        if (status == 200) {
            // Success
            current_story = story_data;
        } else {
            // Failure
            current_story = null;
        }

        // Update Page <-- Work with Joseph
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