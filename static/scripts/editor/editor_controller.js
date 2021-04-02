// Ajax script for editor stuff

// TODO: List of things to do
// - Keep track of page on for story
// - List of functions 

// - List of editor class

// [[string, function], ...]
// - popup
//     - z-index for "Open" new story

// changing live story

// TODO: Keep dict story_name: last_viewed_page

editor = new Editor();
current_story = null;
current_page = null;
all_story_ids = []
// open_story_list = [] // names of the open stories

open_story_btn = null;
all_page_ids = null;
clicked_page_btn = null;


// Initializes Quill Editor
quill = null;

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
            current_story = story_data['story_name'];
            editor.openStory(story_data);
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
        var num_pages = editor.getStoryPageList(current_story).length
        // TODO: Fill in metadata stuff later
        // text = text + "id=" + button.id + ", \nroot=" + current_story['root_name'] + ",\nname=" + current_story["story_name"] + ", \n#pages=" + num_pages;
        document.getElementById("metadata").innerHTML = text;

        removeAllChildren('page-list')
        var header = document.createElement("h1");
        header.innerHTML = "Page List";
        document.getElementById('page-list').appendChild(header);
        // pagelist.appendChild(header);

        // var all_page_ids = Object.values(current_story['page_nodes'])
        // var all_page_ids = editor.getStoryPageList(current_story)
        var page_name_dic = editor.getStoryPageList(current_story)
        all_page_ids = Object.keys(page_name_dic)
        
        // TODO: Get the page names instead of ids
        // All id empty list, objects.values(current_story['page_nodes'])
        for (let i = 0; i < all_page_ids.length; i++) {
            var b = document.createElement("button");
            b.innerHTML = page_name_dic[all_page_ids[i]];
            b.setAttribute('class', 'page_button')
            b.setAttribute('page_id', all_page_ids[i])
            document.getElementById('page-list').appendChild(b);
        }
    })
}

// Opening a Story
// expecting <button id='replace-me-with-open-button' story_id='story_id'></button>
// $(".storybox").click(function(e)  {
//     get_story_data(e);
// });

$(".div5").on("click", ".storybox", function(e) {
    get_story_data(e);
});

$(".popup").on("click", ".open_story", function(e) {
    var new_btn = document.createElement("button");
    new_btn.innerHTML = e.target.innerHTML;
    new_btn.setAttribute('class', 'storybox');
    new_btn.setAttribute('id', e.target.id);

    // all_story_ids.removeChild(e.target.id)
    // all_story_ids = all_story_ids.filter(function(e2) { return e2 != e.target.id })
    // open_story_list.push(e.target.id)

    var story_list = document.getElementById("storage");
    var add_btn = document.getElementById("+");
    story_list.removeChild(add_btn);

    document.getElementById("storage").appendChild(new_btn);
    document.getElementById("storage").appendChild(add_btn);
    // e.target.style.display = "none";
    document.getElementById('popup-box').style.display = "none";
    document.getElementById('popup-box').removeChild(e.target);
    new_btn.click();
});


// Saving a Story
$("#save_story").click(function(e) {
    if (current_story == null) {
        alert("Story ID was not provided")
        return;
    }

    current_story_id = editor.getStoryState(current_story)['story_id'];

    $.post("/editor/save_story", 
    {
        'story_name': current_story_id,    // Replace with story_id
        'story_data': JSON.stringify(editor.getStoryState(current_story)),
    },
    function(data, status) {
        if (status == "success") {
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

$('.popup').on('click', '.close', function(e) {
    var popup = e.target.parentElement;
    temp = popup;
    var hidden = popup.style.display == 'none';

    if (hidden) {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
})


function checkName (strng) {
    var error = "";
    
        // TODO: Allow hyphens and underscores
        var illegalChars = /[^\w\s]/g; // allow letters, numbers, and underscores
        if (strng == "") {
               error = "Please enter your name.\n";
        }
        else if((strng.length < 2)) {
            error = "The name is the wrong length.\n";
        }
        else if (illegalChars.test(strng)) {
            error = "The name contains illegal characters.\n";
        }
    return error;
}

$(".div7").on("click", ".page_button", function(e) {
    var story_state = story_state = editor.getStoryState(current_story);
    let page = story_state['page_nodes'][e.target.getAttribute('page_id')];
    document.getElementById("page-pane-child").innerHTML = page.page_body_text;
    current_page = e.target.getAttribute('page_id');

    if (clicked_page_btn != null) {
        clicked_page_btn.style.background='#8DD883';
    }
    
    clicked_page_btn = e.target;
    clicked_page_btn.style.background = 'rgba(255, 255, 255, 0.90)';

    updateParentNodes(current_page);
    updateChildNodes(current_page);
    
});

$("#child-nodes").on("click", ".page_button", function(e) {
    var story_state = story_state = editor.getStoryState(current_story);
    let page = story_state['page_nodes'][e.target.getAttribute('page_id')];
    document.getElementById("page-pane-child").innerHTML = page.page_body_text;
    current_page = e.target.getAttribute('page_id');
    updateParentNodes(current_page);
    updateChildNodes(current_page);
});

$("#parent-nodes").on("click", ".page_button", function(e) {
    var story_state = story_state = editor.getStoryState(current_story);
    let page = story_state['page_nodes'][e.target.getAttribute('page_id')];
    document.getElementById("page-pane-child").innerHTML = page.page_body_text;
    current_page = e.target.getAttribute('page_id');
    updateParentNodes(current_page);
    updateChildNodes(current_page);
});



// Refactored to remove wizard population
var operations = editor.getOperations();
var added_params = [];
var editor_form = $('#editor_wizard > div > form')[0]

$('#editor_wizard > div > form').empty()
for (let i = 0; i < operations.length; i++) {
    var b = document.createElement("button");
    b.innerHTML = operations[i]['name'];
    b.setAttribute('id', operations[i]['name']);
    b.setAttribute('index', i);
    b.setAttribute('class', 'wizard_btns');
    // b.setAttribute('class', 'open_story');
    $(".div8")[0].appendChild(b);
    // for (let j = 0; j < operations[i]['params'].length; j++) {
    //     if (operations[i]['params'][j]['param_label'] != null) {
            

    //         if (!added_params.includes(operations[i]['params'][j]['param'])) {
    //             console.log(operations[i]['params'][j]);

    //             added_params.push(operations[i]['params'][j]['param']);
    //             let new_element_label = document.createElement('label');
    //             new_element_label.innerHTML = operations[i]['params'][j]['param_label'];
    //             new_element_label.setAttribute('id', operations[i]['params'][j]['param_label']);

    //             editor_form.appendChild(new_element_label);

    //             if (operations[i]['params'][j]['param_type'] == 'text') {
    //                 let new_element = document.createElement('input');
    //                 new_element.setAttribute('id', operations[i]['params'][j]['param_label'])
    //                 editor_form.appendChild(new_element);
    //             }
    //             else if (operations[i]['params'][j]['param_type'] == 'rich_text') {
    //                 let new_element = document.createElement('input');
    //                 new_element.setAttribute('id', operations[i]['params'][j]['param_label'])
    //                 editor_form.appendChild(new_element);
    //             }
    //             else if (operations[i]['params'][j]['param_type'] == 'dropdown') {
    //                 let new_element = document.createElement('select');
                    
    //                 new_element.setAttribute('id', operations[i]['params'][j]['param_label'])
    //                 populateOptions(new_element, operations[i]['params'][j]['param']);
    //                 editor_form.appendChild(new_element);
    //             }
    //             else {
    //                 alert("No type specified " + operations[i]['params'][j]['param_type'] == 'dropdown');
    //             }
    //         }
    //     }
    // }
}

function populateOptions(parent_select, param_name) {
    console.log(parent_select);
    console.log(param_name);

    all_nodes = editor.getStoryState(current_story)['page_nodes']

    if (param_name == 'substory_name') {
        // Get All the different stories
        for (let i = 0; i < all_story_ids.length; i++) {
            let option = document.createElement('option');
            option.innerHTML = all_story_ids[i];
            option.setAttribute('name', all_story_ids[i]);

            parent_select.appendChild(option);
        }

        for (let i = 0; i < Object.keys(editor.openStories).length; i++) {
            let option = document.createElement('option');
            option.innerHTML = Object.keys(editor.openStories)[i];
            option.setAttribute('name', Object.keys(editor.openStories)[i]);
            
            parent_select.appendChild(option);
        }

    } else {
        for (let i = 0; i < all_page_ids.length; i++) {
            let option = document.createElement('option');
            option.innerHTML = all_nodes[all_page_ids[i]]['page_name'];
            option.setAttribute('name', all_page_ids[i]);

            parent_select.appendChild(option);
        }
    }
}


$('.div8').on("click", ".wizard_btns", function(e) {
    index = parseInt(e.target.getAttribute('index'))
    story_params = editor.getOperations()[index];

    form_elements = $('#editor_wizard > div > form')[0].childNodes

    for (let i = 0; i < form_elements.length; i++) {
        form_elements[i].style.display = 'none';
        for (let j = 0; j < story_params['params'].length; j++) {
            if (story_params['params'][j]['param_label'] == form_elements[i].getAttribute('id')) {
                form_elements[i].style.display = '';
            }
        }
    }

    $('#editor_wizard')[0].style.display = 'block';
});


function generateWizard(e) {
    // header = $('#wizard_header')[0];
    operations = editor.getOperations()
    index = parseInt(e.target.getAttribute('index'))

    // Update Header
    $('#wizard_title')[0].innerHTML = operations[index]['name']
    $('#wizard_instruction')[0].innerHTML = operations[index]['op_label']


    // Update Form
    form = $('#wizard_form')[0]
    $('#wizard_form').empty()

    for (let i = 0; i < operations[index]['params'].length; i++) {
        let element_label = document.createElement('label');
        element_label.innerHTML = operations[index]['params'][i]['param_label'];
        form.appendChild(element_label);

        if (operations[index]['params'][i]['param_type'] == 'dropdown') {
            let element = document.createElement('select');
            element.setAttribute('param_label', operations[index]['params'][i]['param_label']);
            element.setAttribute('param_name', operations[index]['params'][i]['param']);
            populateOptions(element, operations[index]['params'][i]['param']);
            form.appendChild(element);
        } else if (operations[index]['params'][i]['param_type'] == 'text') {
            let element = document.createElement('input');
            element.setAttribute('param_name', operations[index]['params'][i]['param']);
            form.appendChild(element);
        } else if (operations[index]['params'][i]['param_type'] == 'rich_text') {
            let div = document.createElement('div');
            div.setAttribute('id', 'editor');
            let p = document.createElement('p');
            p.innerHTML = editor.getStoryState(current_story)['page_nodes'][current_page]['page_body_text'];
            div.setAttribute('param_name', operations[index]['params'][i]['param']);
            div.appendChild(p);
            
            form.appendChild(div);

            quill = new Quill('#editor', {
                theme: 'snow'
            });

        } else if (operations[index]['params'][i]['param_type'] == 'current_story') {
            let element = document.createElement('input');
            form.removeChild(element_label);
            element.style.display = 'none';
            element.value = current_story;
            form.appendChild(element);
        } else if (operations[index]['params'][i]['param_type'] == 'current_page') {
            let element = document.createElement('input');
            form.removeChild(element_label);
            element.style.display = 'none';
            element.value = current_page;
            form.appendChild(element);
        } else {
            alert("You messed up");
        }
    }

    $('.submit_wizard')[0].setAttribute('index', index);
}

$('.div8').on('click', '.wizard_btns', function(e) {
    generateWizard(e);
})


function updateParentNodes(page_id) {
    story = editor.getStoryState(current_story);
    all_nodes = story['page_nodes'];
    parent_names = []
    parent_ids = []
    fields = []

    page_ids = Object.keys(all_nodes)
    for (let i = 0; i < page_ids.length; i++) {
        if (Object.keys(all_nodes[page_ids[i]]['page_children']).includes(page_id)) {
            parent_names.push(all_nodes[page_ids[i]]['page_name']);
            fields.push(['page_button', page_ids[i]]);
        }
    }

    $('#parent-nodes').empty()
    populateButton('parent-nodes', parent_names, ['class', 'page_id'], fields);
}

function updateChildNodes(page_id) {
    story = editor.getStoryState(current_story);
    children = story['page_nodes'][page_id]['page_children']

    child_names = []
    child_ids = Object.keys(children)
    fields = []

    for (let i = 0; i < child_ids.length; i++) {
        child_names.push(children[child_ids[i]]['child_name']);
        fields.push(['page_button', child_ids[i]]);
    }

    $('#child-nodes').empty()
    populateButton('child-nodes', child_names, ['class', 'page_id'], fields)
}

$('#editor_wizard').on('click', '.submit_wizard', function(e) {
    submit = confirm('Confirm Submission?');

    if (submit) {
        // Do the submission stuff
        editor_function = editor.getOperations()[e.target.getAttribute('index')];
        // param_list = Object.keys(editor_form['params'])
        params = []

        for (let i = 0; i < editor_function['params'].length; i++) {
            param_name = editor_function['params'][i]['param'];
            param_type = editor_function['params'][i]['param_type'];

            if (param_type == 'current_page') {
                params.push(current_page);
            } else if (param_type == 'current_story') {
                params.push(current_story);
            } else if (param_type == 'rich_text') {
                params.push(quill.root.innerHTML);
            } else if (param_type == 'dropdown') {
                field = "[param_name=" + '"' + param_name + '"]';
                console.log(field);
                selected = document.querySelectorAll(field)[0];
                console.log("complete");
                params.push(selected.options[selected.selectedIndex].getAttribute('name'));
            } else {
                field = "[param_name=" + '"' + param_name + '"]';
                params.push(document.querySelectorAll(field)[0].value);
            }
        }

        let fake_btn = document.createElement('button');
        let handlerFunction = 'editor.' + editor_function['function'].split('(')[0] + '(';
        for (let i = 0; i < params.length; i++) {
            handlerFunction += '"' + params[i] + '"';
            if (i != params.length - 1) {
                handlerFunction += ', ';
            }
        }
        handlerFunction += ')';
        fake_btn.setAttribute('onclick', handlerFunction);

        fake_btn.click();

        $('#editor_wizard')[0].style.display = 'none';
        console.log("Before Call");
        refreshPageList();
        refreshOpenPage();
        refreshAllStoryPage();
        refreshOpenStory();

        console.log("Complete Call");
    }
});


function refreshPageList() {
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        return;
    }
    removeAllChildren('page-list')
    var header = document.createElement("h1");
    header.innerHTML = "Page List";
    document.getElementById('page-list').appendChild(header);

    var page_name_dic = editor.getStoryPageList(current_story)
    all_page_ids = Object.keys(page_name_dic)
    
    // TODO: Get the page names instead of ids
    // All id empty list, objects.values(current_story['page_nodes'])
    for (let i = 0; i < all_page_ids.length; i++) {
        var b = document.createElement("button");
        b.innerHTML = page_name_dic[all_page_ids[i]];
        b.setAttribute('class', 'page_button')
        b.setAttribute('page_id', all_page_ids[i])
        document.getElementById('page-list').appendChild(b);
    }
}

function refreshOpenPage() {
    console.log("Refresh Page Called");
    // TODO: CHANGE THIS / FIX IT
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        return;
    }
    updateChildNodes(current_page);
    updateParentNodes(current_page);
    body_text = editor.getStoryState(current_story)['page_nodes'][current_page]['page_body_text'];
    
    $('#page-pane-child')[0].innerHTML = body_text;
}

function refreshOpenStory() {
    openStoryIDs = editor.getOpenStoryIDs();

    story_list = $('#storage')[0].children;
    for (let i = 0; i < story_list.length - 1; i++) {
        isIn = false;
        
        for (let j = 0; j < openStoryIDs.length; j++) {
            if (story_list[i].innerHTML == openStoryIDs[j]) {
                isIn = true;
            }
        }

        if (!isIn) {
            console.log(story_list[i].innerHTML);
            $('#storage')[0].removeChild(story_list[i]);
        }
    }
}

function refreshAllStoryPage() {
    removeAllChildren('popup-box');
    let span = document.createElement('span');
    span.setAttribute('class', 'close');
    span.innerHTML = '&times;';

    let header = document.createElement('h1');
    header.innerHTML = 'Select a Story to Open';

    var pagelist = document.getElementsByClassName('popup')[0];
    pagelist.appendChild(span);
    pagelist.appendChild(header)

    openStoryIDs = editor.getOpenStoryIDs();
    for (let i = 0; i < all_story_ids.length; i++) {
        isIn = false;

        for (let j = 0; j < openStoryIDs.length; j++) {
            if (all_story_ids[i] == openStoryIDs[j]) {
                isIn = true;
            }
        }

        if (!isIn) {
            var b = document.createElement("button");
            b.innerHTML = all_story_ids[i];
            b.setAttribute('id', all_story_ids[i]);
            b.setAttribute('class', 'open_story');

            pagelist.appendChild(b);
        }
    }
}


// Buttons to event handlers --> field matthew stored
// Setting some field to button --> distinguishing params needed


/* Functionalities Needed
TODO: Populate Open Stories Menu
TODO: Populate Pages in Current Story
TODO: Populate button settings
TODO: Populate Parent Nodes     |
TODO: Populate Child Nodes      | these three can be grouped together
TODO: Populate Page Body Text   |
TODO: Generate Wizard
*/

/* Helper Functions to write/rewrite
TODO: Remove all elements with a certain tag <- Returns all removed elements in order of first to last
TODO: Create buttons with specified class tag, id tag (or null if not)
*/

/* Event Handlers
TODO: Display Popup, Get All Available Stories
TODO: 
*/


function removeAllChildren(parent_id) {
    let removed_elements = []
    parent_element = document.getElementById(parent_id);
    while (parent_element.firstChild)
        removed_elements.push(parent_element.removeChild(parent_element.firstChild))

    return removed_elements;
}

function populateButton(parent_id, button_names, button_field_names, button_fields) {
    parent_element = document.getElementById(parent_id);
    for (let i = 0; i < button_names.length; i++) {
        let new_btn = document.createElement('button');
        new_btn.innerHTML = button_names[i];

        for (let j = 0; j < button_field_names.length; j++)
            new_btn.setAttribute(button_field_names[j], button_fields[i][j]);
        parent_element.appendChild(new_btn);
    }
}





// Duplicate Story pages field shows up twice
// Change param_label name to be distinct for root-id/page-id
// Connect story Parent Story Page missing
//  - One may be overriding the other