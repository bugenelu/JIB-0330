// Create Global Variables
editor = new Editor();  // The local editor
current_story = null;   // The current story being displayed by the UI
current_page = null;    // The current page being displayed by the UI
quill = null;           // Quill Editor Element
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

/*
* Updates the story_data variable to match the database
* Note that the GET request is synchronous and intentionally so
*/
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

/*
* Pulls story json from database and properly sets the current_story field
* Note that the GET request is synchronous and intentionally so
*/
function get_story_data(e) {
    response = $.ajax({
        type: 'GET',
        url: '/editor/open_story/' + e.target.id,
        async: false
    });

    if (response['status'] != 200) {
        story_data = editor.getOpenStoryData();
        if (!(story_data['story_name'].includes(e.target.innerHTML))) {
            current_story = null;
            current_page = null;
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

/*
* Dynamically populates the wizard form with the proper fields.
* @param e: Event trigger attached to button that launches wizard
*/
function generateWizard(e) {
    operations = editor.getOperations();
    index = parseInt(e.target.getAttribute('index'));

    $('#wizard_title')[0].innerHTML = operations[index]['name'];
    $('#wizard_instruction')[0].innerHTML = operations[index]['op_label'];

    form = $('#wizard_form')[0];
    $('#wizard_form').empty();

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
            let div = document.createElement('form');
            div.setAttribute('id', 'editor');
            let p = document.createElement('textarea');
            p.innerHTML = editor.getStoryState(current_story)['page_nodes'][current_page]['page_body_text'];
            div.setAttribute('param_name', operations[index]['params'][i]['param']);
            div.appendChild(p);
            
            form.appendChild(div);

            // quill = new Quill('#editor', {
            //     theme: 'snow'
            // });

            tinymce.init({
                selector: 'textarea',  // change this value according to your HTML
                content_css: 'default',
                a_plugin_option: true,
                a_configuration_option: 400,
                height: 450,
                menu: {
  					edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
  					format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript codeformat | formats fontformats fontsizes align lineheight | removeformat' },
  					tools: { title: 'Tools', items: 'wordcount | code' },
    				// HTML: { title: 'HTML', items: 'code' }
  				},
                plugins: [
                    ' advlist anchor autolink codesample fullscreen help image imagetools',
                    ' lists link media noneditable preview',
                    ' searchreplace table visualblocks wordcount',
                    ' code'
                ],
                toolbar: 'undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | link image tinydrive',
                spellchecker_dialog: true,
                menubar: 'edit format tools HTML'  // adds happy to the menu bar
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
/*
* Refreshes all elements visible of page
* Note this does not include the open story popup or the wizard
*/
function refreshAllPage() {
    refreshOpenStoryOptions();
    refreshPageList();
    refreshMetaData();
    refreshOpenPage();
}

/*
* Refreshes all popup elements on the page
* Note that there is no refresh for the wizard
*/
function refreshPopups() {
    refreshStoryPopup();
}

/*
* Refreshes the open story options provided as a popup window
*/
function refreshStoryPopup() {
    updateAllStoryIDs();
    removeAllChildren('popup-box');
    open_ids = editor.getOpenStoryIDs();
    
    header = document.createElement('h1');
    header.innerHTML = 'Select an Engine to Open';
    close_btn = document.createElement('span');
    close_btn.innerHTML = '&times;';
    close_btn.setAttribute('class', 'close');
    create_btn = document.createElement('button');
    create_btn.setAttribute('id', 'create_story');
    create_btn.innerHTML = 'New Engine';
    create_btn.setAttribute('index', '2');          // This value is HARDCODED, sue me
    $('#popup-box')[0].appendChild(close_btn);
    $('#popup-box')[0].appendChild(header);
    $('#popup-box')[0].appendChild(create_btn);
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

/*
* Refreshes the menu bar that contains the list of open stories
*/
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

/*
* Refreshes the Page List menu
*/
function refreshPageList() {
    header = $('.div7 > h1')[0];
    story_map = $('#view_storymap')[0];
    removeAllChildren('page-list');
    $('#page-list')[0].appendChild(header);
    $('#page-list')[0].appendChild(story_map);

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

/*
* Refreshes the metadata shown on the page
*/
function refreshMetaData() {
    $('#metadata')[0].innerHTML = '';
    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_page = null;
        return;
    }

    meta = 'Metadata: ';
    num_pages = Object.keys(editor.getStoryPageList(current_story)).length;
    story_id = editor.openStories[current_story].getCurrent().story_id;
    meta += 'id=' + story_id + ', name=' + current_story + ', root=' + 
        editor.getStoryState(current_story)['root_name'] + ', #pages=' + num_pages;
    $('#metadata')[0].innerHTML = meta;
}

/*
* Refreshes the Page Node data shown on the page
*/
function refreshOpenPage() {
    updatePageChildNodes(current_page);
    updatePageParentNodes(current_page);

    if (!(Object.keys(editor.openStories).includes(current_story))) {
        current_page = null;
        $('#page-body').empty();
        page_pane_child = document.createElement('p');
        page_pane_child.setAttribute('id', 'page-pane-child')
        $('#page-body')[0].appendChild(page_pane_child);
        return;
    } else if (!(Object.keys(editor.getStoryState(current_story)['page_nodes']).includes(current_page))) {
        $('#page-body').empty();
        page_pane_child = document.createElement('p');
        page_pane_child.setAttribute('id', 'page-pane-child')
        $('#page-body')[0].appendChild(page_pane_child);
        return;
    }

    $('#page-body').empty();

    page_data = editor.getPageData(current_story, current_page);
    body_text = page_data['page_body_text'];
    child_dic = page_data['page_children'];

    page_pane_child = document.createElement('p');
    page_pane_child.innerHTML = body_text;
    page_pane_child.setAttribute('id', 'page-pane-child')
    $('#page-body')[0].appendChild(page_pane_child);

    Object.values(child_dic).forEach(child => {
        child_link = document.createElement('p');
        child_link.innerHTML = child['link_text'];
        child_link.setAttribute('class', 'link_text');
        $('#page-body')[0].appendChild(child_link);
    });
    
}

/*
* Helper that updates the Child Nodes for the Page Node currently shown on the page
*/
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

/*
* Helper that updates the Parent Nodes for the Page Node currently shown on the page
*/
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
    current_story = e.target.innerHTML;
    current_page = null;
    refreshAllPage();
});

/*
* Event listener for when a story is selected to be opened from database
*/
$('.popup').on('click', '.open_story', function(e) {
    get_story_data(e);
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
* Event listener for when the create story option is selected
*/
$('.popup').on('click', '#create_story', function(e) {
    $('#popup-box')[0].style.display = 'none';
    generateWizard(e);
    $('#editor_wizard')[0].style.display = 'block';
});

/*
* Event listener for when a Page Node is selected to be viewed from the page list
*/
$('.div7').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

/*
* Event listener for when a Page Node is selected to be viewed from a child node
*/
$('#child-nodes').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

/*
* Event listener for when a Page Node is selected to be viewed from a parent node
*/
$('#parent-nodes').on('click', '.page_button', function(e) {
    current_page = e.target.getAttribute('page_id');
    // refreshOpenPage();
    refreshAllPage();
});

/*
* Event listener for when selecting the option to open more stories
*/
$('.div5').on('click', '.add_storybox', function(e) {
    hidden = $('#popup-box')[0].style.display == 'none';
    if (hidden){
        $('#popup-box')[0].style.display = 'block';
        refreshStoryPopup();
    } else{
        $('#popup-box')[0].style.display = 'none';
    }
});

/*
* Event listener for closing a popup window
*/
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

/*
* Event listener for opening a wizard for editing
*/
$('.div8').on('click', '.page_op', function(e) {
    if (current_story == null)
        return;
    generateWizard(e);
    $('#editor_wizard')[0].style.display = 'block';
});

$('.div6').on('click', '.engine_op', function(e) {
    if (current_story == null && e.target.innerHTML != 'New Engine') 
        return
    generateWizard(e);
    $('#editor_wizard')[0].style.display = 'block';
});

/*
* Event listener for submitting edits from wizard
*/
$('#editor_wizard').on('click', '.submit_wizard', function(e) {
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
            params.push(tinymce.activeEditor.getContent().replaceAll('\n', ''));
        } else if (param_type == 'dropdown') {
            field = "[param_name=" + '"' + param_name + '"]';
            selected = document.querySelectorAll(field)[0];
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
});

/*
* Event listener for saving changes to the databasea
*/
$('#save_story').click(function(e) {
    if (current_story == null) {
        alert('No story selected to be saved');
        return;
    }

    current_story_id = prompt('Engine ID to Save As', editor.getStoryState(current_story)['story_id']);
    editor.getStoryState(current_story)['story_id'] = current_story_id;
    if (!confirm('Confirm Save?')) {
        return;
    }

    data = editor.getStoryState(current_story);
    data['story_id'] = current_story_id;

    $.post("/editor/save_story", 
    {
        'story_id': current_story_id,
        'story_data': JSON.stringify(data),
        'confirm_save': false
    },
    function(data, status, response) {
        if (status == "success") {
            if (response['responseJSON']['success']) {
                alert(response['responseJSON']['msg']);
                old_id = editor.getStoryState(current_story)['story_id'];
                document.getElementById(old_id).id = current_story_id;
                editor.editStoryID(current_story, current_story_id);

            } else {
                if (response['responseJSON']['retry']) {
                    if (confirm(response['responseJSON']['msg'])) {
                        new_story_id = current_story_id;
                        $.post("/editor/save_story", 
                        {
                            'story_id': new_story_id,
                            'story_data': JSON.stringify(editor.getStoryState(current_story)),
                            'confirm_save': true
                        },
                        function(data, status, response) {
                            if (status == 'success') {
                                if (response['responseJSON']['success']) {
                                    alert(response['responseJSON']['msg']);
                                } else {
                                    alert(response['responseJSON']['msg']);
                                }
                            } else {
                                alert('Failed to properly contact server for save');
                            }
                        });
                    }
                } else {
                    alert(response['responseJSON']['msg']);
                }
            }
        } else {
            alert('Failed to properly contact server for save');
        }
    });
});

/*
* Event handler for opening the storymap view
*/
$('.div7').on('click', '#view_storymap', function(e) {
    if (current_story != null) {
        page_pane = $('#page-pane')[0];
        // story_map = $('#map_iframe')[0];
        // story_iframe = $('#map_iframe')[0];
        // story_map = story_iframe.contentWindow.document.getElementById('map_canvas');
        story_map = $('#map_frame')[0];

        if (story_map.style.display == 'none') {
            $('#map_canvas').empty();
            header = document.createElement('h1');
            header.innerHTML = 'Story Map';
            $('#map_canvas')[0].appendChild(header);

            tree_data = editor.getStoryPageTree(current_story);
            focus_page = current_page == null ?
                editor.getStoryState(current_story)['root_id'] : current_page;

            load_map(tree_data, focus_page);
        }

        page_pane.style.display = page_pane.style.display == 'none' ?
            '' : 'none';
        story_map.style.display = story_map.style.display == 'none' ?
            'block' : 'none';
    }
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

/*
* Creates and appends a series of buttons to some element with a HTML ID
* @param {string} parent_id: ID of html element to add buttons to
* @param {list} button_names: List of names to create buttons for
* @param {list} button_field_names: List of name of additional attributes to add to button
* @parm {list[list]} button_fields: List of a list containing values of fields specified in previous argument
*/
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

/*
* Adds a parameter to the wizard based on the param specification from editor.getOperations()
* Note this function is specifically for parameters of type dropdown
* @param parent_select: The parent element from which to add elements to
* @param param_name: Name of the parameter to assign
*/
function populateOptions(parent_select, param_name) {
    all_nodes = editor.getStoryState(current_story)['page_nodes']

    if (param_name == 'substory_name') {
        // Get All the different stories opened
        open_story_data = editor.getOpenStoryData();
        for (let i = 0; i < open_story_data['story_id'].length; i++) {
            let option = document.createElement('option');
            option.innerHTML = open_story_data['story_name'][i];
            option.setAttribute('name', open_story_data['story_name'][i]);
            option.setAttribute('story_id', open_story_data['story_id'][i]);

            parent_select.appendChild(option);
        }

        // for (let i = 0; i < Object.keys(editor.openStories).length; i++) {
        //     let option = document.createElement('option');
        //     option.innerHTML = Object.keys(editor.openStories)[i];
        //     option.setAttribute('name', Object.keys(editor.openStories)[i]);
            
        //     parent_select.appendChild(option);
        // }

    } else {
        if (param_name == 'child_id') {
            child_page_ids = editor.getStoryState(current_story)['page_nodes'][current_page]['page_children'];
            for (let i = 0; i < Object.keys(child_page_ids).length; i++) {
                let option = document.createElement('option');
                option.innerHTML = child_page_ids[Object.keys(child_page_ids)[i]]['child_name'];
                option.setAttribute('name', Object.keys(child_page_ids)[i]);

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
}

/*
* Creates all necessary buttons for different wizard settings
*/
function initializeWizard() {
    operations = editor.getOperations();
    for (let i = 0; i < operations.length; i++) {
        new_btn = document.createElement('button');
        new_btn.innerHTML = operations[i]['name'];
        new_btn.setAttribute('id', operations[i]['name']);
        new_btn.setAttribute('index', i);
        if (operations[i]['global_op']) {
            new_btn.setAttribute('class', 'engine_op');
            $('.div6')[0].appendChild(new_btn);
        } else {
            new_btn.setAttribute('class', 'page_op');
            $('.div8')[0].appendChild(new_btn);
        }
    }
}