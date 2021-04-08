// Create Global Variables
editor = new Editor();  // The local editor
current_story = null;   // The current story being displayed by the UI
current_page = null;    // The current page being displayed by the UI
quill = null;           // Quill Editor Element
wait_fetch_story_id = false;
story_data = {'story_id': [], 'story_name': []};

refreshStoryPopup();
initializeWizard();

/**
 * Gets a dictionay containing the list of Page IDs and Page Names
 * @returns {'page_id': [], 'page_name': []} 
 */
function getStoryPageData() {
    page_data = {'page_id': [], 'page_name': []};
    if (current_story == null) {
        return page_data;
    }
    editor_data = editor.getStoryPageList(current_story);
    for (let i = 0; i < editor_data.length; i++) {
        page_data['page_id'].push(editor_data[i]['page_id']);
        page_data['page_name'].push(editor_data[i]['page_name']);
    }

    return page_data;
}

// Functiont that updates the list of story_data['story_id'] by calling a fetch
// Careful, ajax is async and can cause an issue
function updateAllStoryIDs() {
    response =  $.ajax({
        type: 'GET',
        url: '/editor/get_all_stories',
        async: false,
    });

    if (response['status'] == 200)
        story_data = response['responseJSON'];
    else
        story_data = {'story_id': [], 'story_name': []};
}

function get_story_data(e) {
    response = $.ajax({
        type: 'GET',
        url: '/editor/open_story/' + e.target.id,
        async: false
    })

    if (response['status'] != 200) {
        story_data = editor.getOpenStoryData();
        if (!(story_data['story_name'].includes(e.target.innerHTML))) {
            current_story = null;
            return;    
        }

        for (let i = 0; i < story_data['story_id'].length; i++) {
            if (story_data['story_id'][i] == e.target.id) {
                current_story = story_data['story_name'][i];
                break;
            }
        }
    } else {
        if (response['responseJSON']['story_name'] != e.target.innerHTML) {
            // Check Local Version of Story
            current_story = e.target.innerHTML;
        } else {
            editor.openStory(response['responseJSON']);
            current_story = response['responseJSON']['story_name'];
        }
    }
}


function generateWizard(e) {
    operations = editor.getOperations();
    index = parseInt(e.target.getAttribute('index'));
;
    $('#wizard_title')[0].innerHTML = operations[index]['name'];
    $('#wizard_instruction')[0].innerHTML = operations[index]['op_label'];

    form = $('#wizard_form')[0];
    $('#wizard_form').empty();

    for (let i = 0; i < operations[index]['params'].length; i++) {
        console.log("Running");
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


//////////////////////////////////////////////////////////////////////////////
////////////////////////////// Refresh Function //////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function refreshAllPage() {
    refreshOpenStoryOptions();
    refreshPageList();
    refreshMetaData();
    refreshOpenPage();
}

function refreshPopups() {
    refreshStoryPopup();
}

function refreshStoryPopup() {
    updateAllStoryIDs();
    removeAllChildren('popup-box');
    open_ids = editor.getOpenStoryIDs();
    
    header = document.createElement('h1');
    header.innerHTML = 'Select a Story to Open';
    close_btn = document.createElement('span');
    close_btn.innerHTML = '&times;';
    close_btn.setAttribute('class', 'close');
    $('#popup-box')[0].appendChild(close_btn);
    $('#popup-box')[0].appendChild(header);
    open_stories = Object.keys(editor.openStories);

    btn_names = []
    fields = []
    for (let i = 0; i < story_data['story_id'].length; i++) {
        if (!(open_ids.includes(story_data['story_id'][i]))) {
            btn_names.push(story_data['story_name'][i]);
            fields.push([story_data['story_id'][i], 'open_story']);
        }
    }

    populateButton('popup-box', btn_names, ['id', 'class'], fields);
}

function refreshOpenStoryOptions() {
    story_data = editor.getOpenStoryData();
    openStories = story_data['story_name'];
    shown_story = [];

    story_list = $('#storage')[0].children;
    for (let i = 0; i < story_list.length - 1; i++) {
        shown_story.push(story_list[i].innerHTML);
        if (!(openStories.includes(story_list[i].innerHTML))) {
            $('#storage')[0].removeChild(story_list[i]);
        } else {
            if (story_list[i].innerHTML == current_story) {
                story_list[i].style.background = 'rgba(255, 255, 255, 0.90)';
            } else {
                story_list[i].style.background = '#8DD883';
            }
        }
    }

    add_btn = $('.add_storybox')[0];
    $('#storage')[0].removeChild(add_btn);
    for (let i = 0; i < openStories.length; i++) {
        if (!(shown_story.includes(openStories[i]))) {
            new_btn = document.createElement('button');
            new_btn.innerHTML = story_data['story_name'][i];
            new_btn.setAttribute('class', 'storybox');
            new_btn.setAttribute('id', editor.getStoryState(story_data['story_name'][i])['story_id']);
            $('#storage')[0].appendChild(new_btn);

            if (story_data['story_name'][i] == current_story) {
                new_btn.style.background = 'rgba(255, 255, 255, 0.90)';
            }
        }
    }

    $('#storage')[0].appendChild(add_btn);
}

function refreshPageList() {
    removeAllChildren('page-list');
    header = document.createElement('h1');
    header.innerHTML = 'Page List';
    $('#page-list')[0].appendChild(header);

    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_page = null;
        return;
    }

    page_data = getStoryPageData();
    for (let i = 0; i < page_data['page_name'].length; i++) {
        new_btn = document.createElement('button');
        new_btn.innerHTML = page_data['page_name'][i];
        new_btn.setAttribute('class', 'page_button');
        new_btn.setAttribute('page_id', page_data['page_id'][i]);
        $('#page-list')[0].appendChild(new_btn);

        if (page_data['page_id'][i] == current_page) {
            new_btn.style.background = 'rgba(255, 255, 255, 0.90)';
        }
    }
}

function refreshMetaData() {
    $('#metadata')[0].innerHTML = '';
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_page = null;
        return;
    }

    meta = 'Metadata: ';
    num_pages = Object.keys(editor.getStoryPageList(current_story)).length;
    meta += 'id=' + $('#metadata')[0].id + ', name=' + current_story + ', root=' + 
        editor.getStoryState(current_story)['root_name'] + ', #pages=' + num_pages;
    $('#metadata')[0].innerHTML = meta;
}

function refreshOpenPage() {
    updatePageChildNodes(current_page);
    updatePageParentNodes(current_page);

    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_page = null;
        $('#page-pane-child')[0].innerHTML = '';
        return;
    } else if (!(Object.keys(editor.getStoryState(current_story)['page_nodes']).includes(current_page))) {
        $('#page-pane-child')[0].innerHTML = '';
        return;
    }

    body_text = editor.getStoryState(current_story)['page_nodes'][current_page]['page_body_text'];
    $('#page-pane-child')[0].innerHTML = body_text;
}

function updatePageChildNodes(page_id) {
    $('#child-nodes').empty()
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_story = null;
        current_page = null;
        return;
    } else if (!(Object.keys(editor.getStoryState(current_story)['page_nodes']).includes(current_page))) {
        return;
    }

    story = editor.getStoryState(current_story);
    children = story['page_nodes'][page_id]['page_children']

    child_names = []
    child_ids = Object.keys(children)
    fields = []

    for (let i = 0; i < child_ids.length; i++) {
        child_names.push(children[child_ids[i]]['child_name']);
        fields.push(['page_button', child_ids[i]]);
    }

    populateButton('child-nodes', child_names, ['class', 'page_id'], fields);
}

function updatePageParentNodes(page_id) {
    $('#parent-nodes').empty();
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_story = null;
        current_page = null;
        return;
    } else if (!(Object.keys(editor.getStoryState(current_story)['page_nodes']).includes(current_page))) {
        return;
    }

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

    populateButton('parent-nodes', parent_names, ['class', 'page_id'], fields);
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// Event Listeners ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////
/*
* Event listener for when a story is to be loaded onto the UI
*/
$('.div5').on('click', '.storybox', function(e) {
    get_story_data(e);
    // refreshPageList();
    // refreshMetaData();
    refreshAllPage();
});

/*
* Event listener for when a story is selected to be opened from database
*/
$('.popup').on('click', '.open_story', function(e) {
    new_btn = document.createElement('button');
    new_btn.innerHTML = e.target.innerHTML;
    new_btn.setAttribute('class', 'storybox');
    new_btn.setAttribute('id', e.target.id);

    add_btn = document.getElementById('+');
    $('#storage')[0].removeChild(add_btn);
    $('#storage')[0].appendChild(new_btn);
    $('#storage')[0].appendChild(add_btn);

    $('#popup-box')[0].style.display = 'none';
    new_btn.click();
});

/*
* Event listener for when a page list is chosen to be loaded in the UI
*/
$('.div7').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

$('#child-nodes').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

$('#parent-nodes').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

$('.div5').on('click', '.add_storybox', function(e) {
    hidden = $('#popup-box')[0].style.display == 'none';
    if (hidden){
        $('#popup-box')[0].style.display = 'block';
        refreshStoryPopup();
    } else{
        $('#popup-box')[0].style.display = 'none';
    }
});

$('.popup').on('click', '.close', function(e) {
    popup = e.target.parentElement;
    hidden = popup.style.display == 'none';
    if (hidden) {
        popup.style.display = 'block';
        refreshPopups();
    } else {
        popup.style.display = 'none';
    }
});

$('.div8').on('click', '.wizard_btns', function(e) {
    generateWizard(e);
    $('#editor_wizard')[0].style.display = 'block';
});


$('#editor_wizard').on('click', '.submit_wizard', function(e) {
    submit = confirm('Confirm Submission?');

    if (submit) {
        editor_function = editor.getOperations()[parseInt(e.target.getAttribute('index'))];
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

        fake_btn = document.createElement('button');
        handlerFunction = 'editor.' + editor_function['function'].split('(')[0] + '(';
        for (let i = 0; i < params.length; i++) {
            handlerFunction += '"' + params[i] + '"';
            if (i != params.length - 1) {
                handlerFunction += ', ';
            }
        }
        handlerFunction += ')';
        fake_btn.setAttribute('onclick', handlerFunction);
        fake_btn.click();

        refreshAllPage();
        $('#editor_wizard')[0].style.display = 'none';
    }
});

$('#save_story').click(function(e) {
    if (current_story == null) {
        alert('Select a story to save');
        return;
    }

    current_story_id = editor.getStoryState(current_story)['story_id'];

    $.post("/editor/save_story", 
    {
        'story_name': current_story_id,
        'story_data': JSON.stringify(editor.getStoryState(current_story)),
    },
    function(data, status) {
        if (status == "success") {
            alert("Story successfully saved");
        } else {
            alert("Story failed to save");
        }
    });
});


//////////////////////////////////////////////////////////////////////////////
////////////////////////// Helper Utility Functions //////////////////////////
//////////////////////////////////////////////////////////////////////////////
/*
* Removes all child elements of an element
* @param parent_id: ID of the parent element to remove children from
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

function populateOptions(parent_select, param_name) {
    all_nodes = editor.getStoryState(current_story)['page_nodes']

    if (param_name == 'substory_name') {
        // Get All the different stories
        for (let i = 0; i < story_data['story_id'].length; i++) {
            let option = document.createElement('option');
            option.innerHTML = story_data['story_id'][i];
            option.setAttribute('name', story_data['story_id'][i]);

            parent_select.appendChild(option);
        }

        for (let i = 0; i < Object.keys(editor.openStories).length; i++) {
            let option = document.createElement('option');
            option.innerHTML = Object.keys(editor.openStories)[i];
            option.setAttribute('name', Object.keys(editor.openStories)[i]);
            
            parent_select.appendChild(option);
        }

    } else {
        all_page_ids = getStoryPageData()['page_id'];
        for (let i = 0; i < all_page_ids.length; i++) {
            let option = document.createElement('option');
            option.innerHTML = all_nodes[all_page_ids[i]]['page_name'];
            option.setAttribute('name', all_page_ids[i]);

            parent_select.appendChild(option);
        }
    }
}


function initializeWizard() {
    operations = editor.getOperations();
    for (let i = 0; i < operations.length; i++) {
        new_btn = document.createElement('button');
        new_btn.innerHTML = operations[i]['name'];
        new_btn.setAttribute('id', operations[i]['name']);
        new_btn.setAttribute('index', i);
        new_btn.setAttribute('class', 'wizard_btns');
        $('.div8')[0].appendChild(new_btn);
    }
}