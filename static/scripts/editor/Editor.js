/**
Welcome to the Editor. The Editor is responsible for:

    Creating StoryGraph objects from database or from UI input.
    Editing and combining open StoryGraph objects, which includes creating new
        PageNode and ChildLink objects as needed.
    Rendering the current state (and data) of open StoryGraph objects for the Admin UI
    Rendering StoryGraph objects to JSON for storage in a database

The Editor keeps an Object representing its open StoryGraphs with 'story_name' keys.
The values are StoryStacks of StoryGraphs with the top of the stack being the most recent version of
a particular graph identified by the key.

This is done to preserve undo ability while the Editor is open. Our expectation is that StoryGraphs
do not contain enough data to cause performance issues with this approach. We can revisit undo
handling if this assumption is wrong.

NOTE:
Be careful when implementing functions that are meant to *read* from StoryGraphs in stacks not to
*pop* a StoryGraph from the stack. This would cause the version to be lost.

NOTE: Starting 4/9/21, the preferred term for a complete interactive narrative is 'Engine', which replaces
use of the term 'Story'. This change will be reflected in labels of the UI. However, work to convert function 
and variable names must wait until minimum viability is reached. Labels in Editor.getOperations() have been
updated.

TODO: Update terminology in the code base to reflect the preferred 'Engine' term 
    e.g StoryGraph -> EngineGraph, StoryStack -> EngineStack, etc.

*/

class Editor {
    /**
     *
     * @param {string} database - identifier for the database, to read and write stories
     */
    constructor() {
        this.openStories = {}; // An Object with a StoryStack for each open StoryGraph
    }

    /**
     * NOTE: With the exception of openStory() and addNodeInGraph(), all Editor operations expect strings for all parameters.
     * Use "name" fields for button labels
     * Use "parameter" lists iterively to generate wizards that collect parameters from the UI. Parameter names have been standardized where possible.
     *
     * Parameter Types:
     *
     *     implicit:
     *     "current_story"
     *     "current_page"
     *
     *     user input required:
     *     "database_story" - select a story from the database
     *     "text" - a short string
     *     "rich_text"  - long string representing HTML for page contents
     *     "page_select" - choose a page in the current story
     *     "story_select" - select a story that is open in the editor
     *     "link_select" - select a link from the current page
     *
     *
     *
     * Use "function" fields to add function calls to UI elements
     *
     * @returns {Object} that has name, parameters, and function calls for edit operations that will need representations in the UI.
     */
    getOperations() {
        // TODO: update 'story_name', 'story_id' parameters to 'engine_name', 'engine_id'
        return [
            {
                "name": "Undo Last Edit",
                "op_label": "Would you like to undo the last edit?",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    }
                ],
                "global_op": false,
                "function": "undoLast(story_name)"
            },
            // {
            //     "name": "Open Story",
            //     "op_label": "Please select a story to open from the story database.",
            //     "params": [
            //         {
            //             "param": "story_data",
            //             "param_label": null,
            //             "param_type": "database_story"
            //         }
            //     ],
            //     "function": "openStory(story_data)" // openStory requires an Object which is received from the database
            // },
            {
                "name": "Close Engine",
                "op_label": "Would you like to close this engine? Unsaved changes are lost.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    }
                ],
                "global_op": true,
                "function": "closeStory(story_name)"
            },
            // {
            //     "name": "New Story",
            //     "op_label": "Create a new story.",
            //     "params": [
            //         {
            //             "param": "story_name",
            //             "param_label": "New Story Name",
            //             "param_type": "text"
            //         },
            //         {
            //             "param": "story_id",
            //             "param_label": "Unique ID For This Story",
            //             "param_type": "text"
            //         },
            //         "story_name",
            //         "story_id"
            //     ],
            //     "global_op": true,
            //     "function": "newStory(story_name, story_id)"
            // },
            {
                "name": "Duplicate Engine", 
                "op_label": "Would you like to duplicate this Engine?",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                ],
                "global_op": true,
                "function": "duplicateStory(story_name)"
            },
            {
                "name": "Edit Engine Name",
                "op_label": "Please enter a new name for this engine.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "update_name",
                        "param_label": "New Engine Name",
                        "param_type": "text"
                    }
                ],
                "global_op": true,
                "function": "editStoryName(story_name, update_name)"
            },
            {
                "name": "Duplicate Engine From Page",
                "op_label": "Please select the page from which you would like to duplicate this story and enter a new new for the duplicate engine.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": "Story Pages",
                        "param_type": "dropdown"
                    }
                ],
                "global_op": true,
                "function": "duplicateFromPage(story_name, page_id)"
            },
            // {
            //     "name": "Edit Story ID",
            //     "op_label": "Please input a new ID for this story.",
            //     "params": [
            //         {
            //             "param": "story_name",
            //             "param_label": null,
            //             "param_type": "current_story" // implicit
            //         },
            //         {
            //             "param": "update_id",
            //             "param_label": "New Story ID",
            //             "param_type": "text" // seems like there are going to be restrictions on characters for this parameter ...
            //         }
            //     ],
            //     "function": "editStoryID(story_name, update_id)"
            // },
            {
                "name": "Change Engine Root",
                "op_label": "Select a new root page for this engine.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": "Story Pages",
                        "param_type": "dropdown"
                    }
                ],
                "global_op": true,
                "function": "editRootID(story_name, page_id)"
            },
            {
                "name": "Connect Engines",
                "op_label": "Select a page in this engine to receive a link to the selected engine.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": "Parent Story Page",
                        "param_type": "dropdown"
                    },
                    {
                        "param": "substory_name",
                        "param_label": "Substory",
                        "param_type": "dropdown"
                    },
                    {
                        "param": "link_text",
                        "param_label": "Link Text",
                        "param_type": "text"
                    }
                ],
                "global_op": true,
                "function": "connectStoryGraphs(story_name, page_id, substory_name, link_text)"
            },
            {
                "name": "Add Page to Engine",
                "op_label": "Create a new page to add to this engine.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "parent_id",
                        "param_label": "Parent Page",
                        "param_type": "dropdown" // TODO: option to make the new page the root in an empty engine...
                    },
                    // {
                    //     "param": "page_body_text",
                    //     "param_label": "New Page Content",
                    //     "param_type": "rich_text"
                    // },
                    {
                        "param": "page_name",
                        "param_label": "New Page Name",
                        "param_type": "text"
                    },
                    {
                        "param": "link_text",
                        "param_label": "Link Text",
                        "param_type": "text"
                    }
                ],
                "global_op": false,
                "function": "addNodeInGraph(story_name, parent_id, page_body_text, page_name, link_text)"
            },
            {
                "name": "Delete Page",
                "op_label": "Deleting a page also removes its descendant pages and opens them as new engines.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": "Page To Delete",
                        "param_type": "dropdown"
                    }
                ],
                "global_op": false,
                "function": "deleteNodeFromGraph(story_name, page_id)"
            },
            {
                "name": "Edit Page Name",
                "op_label": "Change the name of this page.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": null,
                        "param_type": "current_page" // implicit
                    },
                    {
                        "param": "page_name",
                        "param_label": "New Page Name",
                        "param_type": "text"
                    }
                ],
                "global_op": false,
                "function": "editPageName(story_name, page_id, page_name)"
            },
            {
                "name": "Edit Page Contents",
                "op_label": "Update the contents of this page.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": null,
                        "param_type": "current_page" // implicit
                    },
                    {
                        "param": "page_body_text",
                        "param_label": "New Page Contents",
                        "param_type": "rich_text"
                    }
                ],
                "global_op": false,
                "function": "editPageText(story_name, page_id, page_text)"
            },
            {
                "name": "Add Link",
                "op_label": "Add a link from this page.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": null,
                        "param_type": "current_page" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": "Page Link Target",
                        "param_type": "dropdown"
                    },
                    {
                        "param": "link_text",
                        "param_label": "Link Text",
                        "param_type": "text"
                    }
                ],
                "global_op": false,
                "function": "addLinkInGraph(story_name, page_id, child_id, link_text)"
            },
            {
                "name": "Delete Link",
                "op_label": "Delete a link from this page. The target page is not deleted.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": null,
                        "param_type": "current_page" // implicit
                    },
                    {
                        "param": "child_id",
                        "param_label": "Link To Delete",
                        "param_type": "dropdown"
                    }
                ],
                "global_op": false,
                "function": "deleteLinkInGraph(story_name, page_id, child_id)"
            },
            {
                "name": "Edit Link Text",
                "op_label": "Update link text for a link from this page.",
                "params": [
                    {
                        "param": "story_name",
                        "param_label": null,
                        "param_type": "current_story" // implicit
                    },
                    {
                        "param": "page_id",
                        "param_label": null,
                        "param_type": "current_page" // implicit
                    },
                    {
                        "param": "child_id",
                        "param_label": "Link To Edit Text",
                        "param_type": "dropdown"
                    },
                    {
                        "param": "link_text",
                        "param_label": "New Link Text",
                        "param_type": "text"
                    }
                ],
                "global_op": false,
                "function": "editLinkText(story_name, page_id, child_id, link_text)"
            }
        ]
    }

    /**
     *
     * @returns {Object} with the current state of each StoryGraph in this.openStories
     */
    getState() {
        let state = []
        Object.keys(this.openStories).forEach(story => {
            let data = this.openStories[story].getCurrent().toJSON();
            state.push(data);
        });
        return state;
    }

    /**
     *
     * @param {string} story_name - the story to retreive current state for
     * @returns {Object} with the current state of the indicated story
     */
    getStoryState(story_name) {
        return this.openStories[story_name].getCurrent().toJSON();
    }

    /**
     *
     * @param {string} story_name
     * @returns {string[]} a list of nice page names for the indicated story
     */
    getStoryPageList(story_name) {
        return this.openStories[story_name].getCurrent().getPageNameList();
    }

    /**
     * @param {string} story_name
     * @returns {Object} with data to draw a map of the story's pages
     */
    getStoryPageTree(story_name) {
        return this.openStories[story_name].getCurrent().getPageTree();
    }

    getOpenStoryIDs() {
        let all_story_names = Object.keys(this.openStories);
        let open_story_ids = []
        for (let i = 0; i < all_story_names.length; i++)
            open_story_ids.push(this.openStories[all_story_names[i]].getCurrent().toJSON()['story_id']);
        return open_story_ids;
    }

    /**
     * 
     * @param {string} story_name 
     * @param {string} page_id 
     * @returns {Object} representing the current contents of a page in an engine
     */
    getPageData(story_name, page_id) {
        return this.openStories[story_name].getCurrent().page_nodes[page_id].toJSON();
    }

    /**
     * 
     * @param {string} story_name 
     * @param {string} page_id 
     * @returns A list of the page's children
     */
    getPageChildList(story_name, page_id) {
        let page = this.getPageData(story_name, page_id);
        let children = [];
        for (const child in page.page_children) {
            children.push(page.page_children[child]);
        }
        return children;
    }

    /**
     * TODO: Comment needed
     * @returns {string[]} array of strings that are the names of the open stories
     */
    getOpenStoryNames() {
        return Object.keys(this.openStories);
    }

    /**
     * TODO: Comment needed
     * @returns 
     */
    getOpenStoryData() {
        let all_story_names = Object.keys(this.openStories);
        let open_story_ids = []
        for (let i = 0; i < all_story_names.length; i++)
            open_story_ids.push(this.openStories[all_story_names[i]].getCurrent().toJSON()['story_id']);
        return {'story_name': all_story_names, 'story_id': open_story_ids};
    }

    /**
     * TODO: consider edge case where different story in database has same name, and user wants to open both
     * @param {Object} story_data - Object with data of story to add to openStories as a new stack
     * @return {boolean} - True if new stack is created and False otherwise
     */
    openStory(story_data) {
        if (story_data.story_name in this.openStories) {
            console.log('Attempted to open duplicate story.');
            return false;
        } else {
            const new_graph = new StoryGraph(story_data);
            this.openStories[new_graph.story_name] = new StoryStack(new_graph);
            return true;
        }
    }

    /**
     *
     * @param {string} story_name - string identifies story to close. deletes the story's stack from this.openStories
     *
     * TODO: what about a check to see if the story has been saved so work isn't lost?
     */
    closeStory(story_name) {
        if (story_name in this.openStories) {
            delete this.openStories[story_name];
        }
    }

    /**
     *
     * @param {string} story_name - a name to identify the story
     * @param {string} story_id - a unique identifier for the story
     */
    newStory(story_name, story_id) {
        if (!(story_name in Object.keys(this.openStories))) {
            let data = {
                "story_id": story_id,
                "story_name": story_name,
                "root_id": null,
                "root_name": null,
                "page_nodes": {}
            }
            this.openStories[story_name] = new StoryStack(new StoryGraph(data));
        }
    }

    /**
     * Creates a duplicate of the indicated story with a new StoryStack.
     * @param {string} story_name - the story to duplicate.
     */
    duplicateStory(story_name) {
        let stamp = Date.now().toString();
        let copy_name = story_name.concat(" copy");
        let data = this.openStories[story_name].getCurrent().toJSON();
        data.story_id = data.story_id.concat(stamp.substring(stamp.length - 4));
        data.story_name = copy_name;
        this.openStories[copy_name] = new StoryStack(new StoryGraph(data));
    }

    /**
     * TODO: Testing needed.
     * Creates a duplicate of the indicated story with an updated name in a new StoryStack
     * @param {string} story_name
     * @param {string} update_name
     */
    editStoryName(story_name, update_name) {
        let data = this.openStories[story_name].getCurrent().toJSON();
        data.story_name = update_name;
        this.openStories[story_name].push(new StoryGraph(data));
        this.openStories[update_name] = this.openStories[story_name];
        delete this.openStories[story_name];
    }

    /**
     * Creates a duplicate of the indicated story beginning at the indicated page with a new StoryStack
     * @param {string} story_name
     * @param {string} page_id
     */
    duplicateFromPage(story_name, page_id) {
        let pages = this.openStories[story_name].getCurrent().reachableNodes(page_id);
        let data = this.storyDataFromPages(pages, page_id);
        this.openStories[data.story_name] = new StoryStack(new StoryGraph(data));
        return;
    }
    
    storyDataFromPages(page_data, root_id) {
        let data = {
            "story_id": null,
            "story_name": null,
            "root_id": null,
            "root_name": null,
            "page_nodes": null,
        };
        data.page_nodes = page_data;
        data.story_id = root_id.concat("_engine");
        data.story_name = page_data[root_id].page_name;
        data.root_id = root_id;
        data.root_name = page_data[root_id].page_name;
        return data;
    }

    /**
     * Undoes the last edit to a StoryGraph
     * @param {string} story_name - identifes the story to step backwards
     * @returns {StoryGraph} version that was removed from this.openStories. Could be saved in a redo cache.
     */
    undoLast(story_name) {
        if (this.openStories[story_name].size > 1) {
            let undone = this.openStories[story_name].pop();
            let un_name = undone.story_name;
            let new_name = this.openStories[story_name].getCurrent().story_name;
            if (un_name != new_name) {
                this.openStories[new_name] = this.openStories[un_name];
                delete this.openStories[un_name];
            }
            return undone;
        } else {
            console.log('error: attempted to undo initial state');
            return null;
        }
    }

    /**
     * Testing needed
     * @param {string} story_name
     * @param {string} update_id
     */
    editStoryID(story_name, update_id) {
        update = this.openStories[story_name].getCurrent().getCopy();
        update.story_id = update_id;
        this.openStories[story_name].push(update);
    }

    /**
     * Testing needed
     * @param {string} story_name
     * @param {string} new_root_id
     * @returns
     */
    editRootID(story_name, new_root_id) {
        let current = this.openStories[story_name].getCurrent();
        if (!(new_root_id in current.page_nodes)) {
            console.log('attempted to assign unknown page. aborted')
            return false;
        } else {
            let update = this.openStories[story_name].getCurrent().getCopy();
            update.root_id = new_root_id;
            update.root_name = update.page_nodes[new_root_id].page_name;
            this.openStories[story_name].push(update);
            return true;
        }
    }

    /**
     * Connects two open StoryGraphs and adds the result to the parent's stack.
     * @param {string} story_name - name of the parent graph
     * @param {string} page_id - page_id of the page to receive the subtree as descendants
     * @param {string} substory_name - name of the new subtree
     * @param {string} link_text - text for the new link from parent node to subtree
     */
    connectStoryGraphs(story_name, page_id, substory_name, link_text) {
        let parent_graph = this.openStories[story_name].getCurrent();
        let child_graph = this.openStories[substory_name].getCurrent();
        let update = parent_graph.addSubtree(child_graph, page_id, link_text);
        this.openStories[story_name].push(update);
    }

    /**
     * Adds a node to a graph and pushes the update graph to that graph's stack
     * @param {string} story_name - name of the StoryGraph to receive a new node
     * @param {string} parent_id - page_id of the page to receive the new node as a child
     * @param {string} page_name - name for the new page node
     * @param {string} link_text - text for the link to the new node
     */
    addNodeInGraph(story_name, parent_id, page_name, link_text) {
        let new_node_data = {
            "page_name": page_name,
            "page_body_text": "",
            "page_parents": [parent_id],
            "page_children": {}
        }
        const id_num = this.openStories[story_name].getCurrent().getGraphSize() + 1;
        new_node_data["page_id"] = story_name.concat("-" + id_num.toString());
        let new_node = new PageNode(new_node_data);
        let graph = this.openStories[story_name].getCurrent();
        if (parent_id != null) {
            let update = graph.addNode(new_node, parent_id, link_text);
            this.openStories[story_name].push(update);
        } else if (graph.getGraphSize() == 0) {
            let update = graph.getCopy();
            update.root_name = new_node.page_name;
            update.root_id = new_node.page_id;
            update.page_nodes[new_node.page_id] = new_node;
            this.openStories[story_name].push(update);
        } else {
            console.log("failed to add node:"
                        + "parent_id is null while graph has existing root.");
        }
    }

    /**
     * Deletes a node from a StoryGraph and pushes the new version to that graph's stack. Unreachable descendants are also removed.
     * Opens new stacks for the subtrees of nodes reachable from each child of the deleted node.
     * @param {string} story_name
     * @param {string} node_id
     */
    deleteNodeFromGraph(story_name, page_id) {
        let graph = this.openStories[story_name].getCurrent();
        let updates = graph.deleteNode(page_id);
        this.openStories[story_name].push(updates[0]);
        if (updates.length > 1) {
            updates.shift();
            updates.forEach(update => {
                this.openStories[update.story_name] = new StoryStack(update);
            });
        }
    }

    /**
     * Testing needed
     * udpate the name of a page in a graph and add the updated version to that graph's stack
     * @param {string} story_name
     * @param {string} page_id
     * @param {string} page_name
     */
    editPageName(story_name, page_id, page_name) {
        let current = this.openStories[story_name].getCurrent();
        let update = current.updatePageName(page_id, page_name);
        this.openStories[story_name].push(update);
    }

    /**
     * Update the text of a page in a graph and add the updated version to that graph's stack
     * @param {string} story_name
     * @param {string} page_id
     * @param {string} page_text
     */
    editPageText(story_name, page_id, page_text) {
        let current = this.openStories[story_name].getCurrent();
        let update = current.updatePageText(page_id, page_text);
        this.openStories[story_name].push(update);
    }

    /**
     * Adds a link between two existing pages in the indicated story graph. Link points from page_id to child_id pages.
     * @param {string} story_name
     * @param {string} page_id
     * @param {string} child_id
     * @param {string} link_text
     */
    addLinkInGraph(story_name, page_id, child_id, link_text) {
        let data = this.openStories[story_name].getCurrent().toJSON;
        let child_name = data.page_nodes[child_id].page_name;
        data.page_nodes[page_id].page_children[child_id] = {
            "child_id": child_id,
            "child_name": child_name,
            "link_text": link_text
        }
        this.openStories[story_name].push(new StoryGraph(data));
    }

    /**
     * Update the text of a link in a graph and add the updated version to that graph's stack
     * @param {string} story_name
     * @param {string} page_id
     * @param {string} child_id
     * @param {string} link_text
     */
    editLinkText(story_name, page_id, child_id, link_text) {
        let data = this.openStories[story_name].getCurrent().toJSON();
        data.page_nodes[page_id].page_children[child_id].link_text = link_text;
        this.openStories[story_name].push(new StoryGraph(data));
    }

    /**
     * TODO: testing needed
     * @param {string} story_name
     * @param {string} page_id
     * @param {string} child_id
     */
    deleteLinkInGraph(story_name, page_id, child_id) {
        let update = this.openStories[story_name].getCurrent().getCopy();
        update.page_nodes[page_id].removeLink(child_id);
        this.openStories[story_name].push(update);
    }
}


/**
 * Custom stack limiting backing array functions and providing convenient access to the current version.
 */
class StoryStack {

    /**
     *
     * @param {StoryGraph} story_graph - an optional StoryGraph object to add when the stack is constructed.
     */
    constructor(story_graph = null) {
        this.MAX_SIZE = 99; // Maximum number of StoryGraphs per stack.
        this.size = 0,
        this.versions = []
        if (story_graph != null) {
            this.push(story_graph);
        }
    }

    /**
     *
     * @param {StoryGraph} version - pushes a StoryGraph to this stack.
     */
    push(version) {
        this.versions.push(version);
        if (this.size == this.MAX_SIZE) {
            this.versions.shift();
        } else {
            this.size += 1;
        }
    }

    /**
     *
     * @returns {StoryGraph} popped from top of this stack.
     */
    pop() {
        if (this.size > 0) {
            this.size -=1;
            return this.versions.pop();
        } else {
            return null;
        }
    }

    /**
     *
     * @returns {StoryGraph} at the top of this stack without popping.
     */
    getCurrent() {
        if (this.size == 0) {
            return null;
        } else {
            return this.versions[this.size - 1];
        }
    }
}

class StoryGraph {
    /**
     *
     * @param {Object} story_data - Object with { story_id, story_name, root_id, root_name, page_nodes{} }
     */
    constructor(story_data) {
        this.story_id = story_data.story_id.toString();
        this.story_name = story_data.story_name;
        this.root_id = story_data.root_id;
        this.root_name = story_data.root_name;
        let pages = story_data.page_nodes;
        this.page_nodes = {};
        Object.values(pages).forEach(page => {
            this.page_nodes[page.page_id] = new PageNode(page);
        });
        Object.values(this.page_nodes).forEach(page => {
            let children = Object.keys(page.page_children);
            for (var i = 0; i < children.length; i++) {
                let child = children[i];
                if (child in this.page_nodes) {
                    this.page_nodes[child].page_parents.push(page.page_id);
                }
            }
        });
    }

    /**
     *
     * @returns {PageNode[]} array of all PageNodes in this StoryGraphy
     */
    getPageList() {
        return Object.values(this.page_nodes);
    }

    /**
     *
     * @returns {Object} a dictionary containing page_name as value and page_id as key
     */
    getPageNameList() {
        // let page_info = {};
        // this.getPageList().forEach(page => {
        //     page_info[page.page_id] = page.page_name;
        // });
        // return page_info;
        let page_info = [];
        if (this.root_id == null) {
            return page_info;
        }
        let visited_set = new Set();
        let open_list = [this.page_nodes[this.root_id]];
        while (open_list.length > 0) {
            let current = open_list.shift();
            if (!visited_set.has(current)) {
                visited_set.add(current);
                let page_elem = {}
                page_elem["page_id"] = current.page_id;
                page_elem["page_name"] = current.page_name;
                page_info.push(page_elem);
                Object.keys(current.page_children).forEach(child => {
                    open_list.push(this.page_nodes[child]);
                });
            }
        }
        for (const current in this.page_nodes) {
            let current_page = this.page_nodes[current];
            if (!visited_set.has(current_page)) {
                let page_elem = {}
                page_elem["page_id"] = current_page.page_id;
                page_elem["page_name"] = current_page.page_name;
                page_info.push(page_elem);
            }
        }
        return page_info;
    }

    /**
     * @returns {Object} with information to represent this Story's page map
     */
    getPageTree() {
        let layers = [];
        if (this.root_id == null) {
            return page_info;
        }
        let visited_set = new Set();
        let edge_set = new Set();
        let open_list = [[this.page_nodes[this.root_id], 0]];
        while (open_list.length > 0) {
            let current = open_list.shift();
            if (!visited_set.has(current[0])) {
                visited_set.add(current[0]);
                if (layers.length <= current[1]) {
                  layers.push([]);
                }
                let page_elem = {};
                page_elem["page_id"] = current[0].page_id;
                page_elem["page_name"] = current[0].page_name;
                layers[current[1]].push(page_elem);
                Object.keys(current[0].page_children).forEach(child => {
                    edge_set.add([current[0].page_id, child]);
                    open_list.push([this.page_nodes[child], current[1] + 1]);
                });
            }
        }
        return [layers, edge_set];
    }

    /**
     *
     * @returns {Object} with metadata for this StoryGraph
     */
    getInfo() {
        return {
            story_id: this.story_id,
            story_name: this.story_name,
            root_id: this.root_id,
            root_name: this.root_name,
        }
    }

    /***
     * @returns {number} the number of PageNodes in this StoryGraph
     */
    getGraphSize() {
        return Object.keys(this.page_nodes).length;
    }

    /**
     *
     * @returns {Object} representing the contents of this StoryGraph and its metadata
     */
    toJSON() {
        const data = this.getInfo();
        data.page_nodes = {};
        Object.values(this.page_nodes).forEach(page => {
            data.page_nodes[page.page_id] = page.toJSON();
        });
        return data;
    }

    /**
     *
     * @returns {StoryGraph} constructed from representation of this StoryGraph i.e. a deep copy
     */
    getCopy() {
        return new StoryGraph(this.toJSON());
    }

    /**
     * Takes a PageNode and appends it as a child of the
     * designated parent in a deep copy of this StoryGraph.
     * @param {PageNode} node_to_add - the PageNode to append
     * @param {string} parent_id - the id of the parent PageNode for the new node
     * @param {string} link_text - the descriptive text of the link.
     * @returns {StoryGraph} that is the new graph
     */
    addNode(node_to_add, parent_id, link_text) {
        const new_node = new PageNode(node_to_add.toJSON());
        new_node.page_parents.push(parent_id);
        const new_id = new_node.page_id;
        const new_name = new_node.page_name;
        const new_graph = this.getCopy();
        const parent = new_graph.page_nodes[parent_id];
        parent.addLink(new_id, new_name, link_text)
        new_graph.page_nodes[new_id] = new_node;
        return new_graph;
    }

    /**
     *
     * @param {StoryGraph} subtree_to_add
     * @param {string} parent_id - id of the PageNode to recieve the root of the subtree as a child.
     * @param {string} link_text - the text for the new link.
     * @returns {StoryGraph} that is the new graph
     */
    addSubtree(subtree_to_add, parent_id, link_text) {
        const new_subtree = subtree_to_add.getCopy();
        new_subtree.page_nodes[new_subtree.root_id].page_parents.push(parent_id);
        const new_root_id = new_subtree.root_id;
        const new_root_name = new_subtree.root_name;
        const new_graph = this.getCopy();
        const parent = new_graph.page_nodes[parent_id];
        parent.addLink(new_root_id, new_root_name, link_text);
        Object.values(new_subtree.page_nodes).forEach(page => {
            if (!(page.page_id in new_graph.page_nodes)) {
                new_graph.page_nodes[page.page_id] = page;
            }
        });
        return new_graph;
    }

    /**
     *
     * @param {string} page_id
     * @param {string} new_text
     * @returns {StoryGraph} for which this is the updated graph.
     */
     updatePageName(page_id, new_text) {
        const new_graph = this.getCopy();
        new_graph.page_nodes[page_id].updatePageName(new_text);
        return new_graph;
    }


    /**
     *
     * @param {string} page_id
     * @param {string} new_text
     * @returns {StoryGraph} for which this is the updated graph.
     */
    updatePageText(page_id, new_text) {
        const new_graph = this.getCopy();
        new_graph.page_nodes[page_id].updateBodyText(new_text);
        return new_graph;
    }

    /**
     *
     * @param {string} page_id - the id of the PageNode parent that has the link to update
     * @param {string} child_id - the id of the ChildLink
     * @param {string} new_text - the new link text
     * @returns
     */
    updatePageLink(page_id, child_id, new_text) {
        const new_graph = this.getCopy();
        new_graph.page_nodes[page_id].page_children[child_id].updateLinkText(new_text);
        return new_graph;
    }

    /**
     * deletes a specified page from the tree.
     * @param {string} page_id - the id of the page to remove.
     * @returns {StoryGraph[]} array of StoryGraph objects. 1st index is this story graph with node and unreachable descendents removed.
     */
    deleteNode(page_id) {
        let new_graphs = [];
        let data_from_root = this.getInfo();
        data_from_root.story_id = data_from_root.story_id.concat("-1");
        data_from_root.story_name = data_from_root.story_name.concat("-1");
        if (page_id == data_from_root.root_id) {
            data_from_root.root_id = null;
            data_from_root.root_name = null;
            data_from_root.page_nodes = {};
            new_graphs.push(new StoryGraph(data_from_root));
        } else {
            let page_nodes = this.reachableNodes(this.root_id, [page_id]);
            data_from_root.page_nodes = page_nodes;
            let parents = this.page_nodes[page_id].page_parents;
            for (var i = 0; i < parents.length; i++) {
                let parent = parents[i];
                delete data_from_root.page_nodes[parent].page_children[page_id];
            }
            new_graphs.push(new StoryGraph(data_from_root));
        }

        let page_children = Object.keys(this.page_nodes[page_id].page_children);
        for (var i = 0; i < page_children.length; i++) {
            let child_id = page_children[i];
            let reachable = this.reachableNodes(child_id, [page_id]);
            let data = {
                "story_id": this.story_id.concat("-".concat(child_id)),
                "story_name": this.story_name.concat("-".concat(child_id)),
                "root_id": child_id,
                "root_name": this.page_nodes[child_id].page_name,
            };
            data.page_nodes = reachable;
            new_graphs.push(new StoryGraph(data));
        }

        return new_graphs
    }

    /**
     * Returns an Object[] array representing PageNodes reached from the root. For use in constructing new StoryGraphs after a delete.
     * @param {string} root_id - id of the start node
     * @param {string[]} exclusion_id - the id's of any nodes to ignore if encountered in the BFS
     * @param {boolean} return_nodes - set to true if return array should be PageNodes instead of Objects. Default is false.
     * @returns an array of Objects representing PageNodes reached via BFS from the root PageNode.
     */
    reachableNodes(root_id, exclusion_ids = null, return_nodes = false) {
        var visited_list = []
        var open_list = []
        if (exclusion_ids == null || (exclusion_ids != null && !exclusion_ids.includes(root_id))) {
            open_list.push(this.page_nodes[root_id]);
        }
        while (open_list.length > 0) {
            let this_node = open_list[0];
            if (!visited_list.includes(this_node)) {
                visited_list.push(this_node);
            }
            let children = Object.keys(this_node.page_children);
            for (var i = 0; i < children.length; i++) {
                if (!open_list.includes(this.page_nodes[children[i]])
                    && !visited_list.includes(this.page_nodes[children[i]])) {
                    if (exclusion_ids != null && (exclusion_ids.includes(children[i]))) {
                        continue;
                    } else {
                        open_list.push(this.page_nodes[children[i]]);
                    }
                }
            }
            open_list.shift();
        }
        let data_for_visited_list = {};
        for (var i = 0; i < visited_list.length; i++) {
            let page = visited_list[i];
            data_for_visited_list[page.page_id] = page.toJSON();
        }
        return data_for_visited_list;
    }
}

class PageNode {
    /**
     * Constructor parameter object fields: page_id, page_name, page_body_text, page_parents, page_children
     *
     * Note: page_chilrden is an object with data to create ChildLink objects
     *
     * @param {Object} page_data - an object representing the contents of this PageNode.
     */
    constructor(page_data) {
        this.page_id = page_data.page_id;
        this.page_name = page_data.page_name;
        this.page_body_text = page_data.page_body_text;
        this.page_parents = [];
        let children = Object.values(page_data.page_children);
        this.page_children = {};
        children.forEach(child => {
            this.page_children[child.child_id] =
                new ChildLink(child.child_id, child.child_name, child.link_text);
        });
    }

    /**
     *
     * @param {String} child_id
     * @param {String} child_name
     * @param {String} link_text
     */
    addLink(child_id, child_name, link_text) {
        this.page_children[child_id] = new ChildLink(child_id, child_name, link_text);
    }

    /**
     *
     * @param {string} new_name - new name for this PageNode
     */
    updatePageName(new_name) {
        this.page_name = new_name;
    }

    /**
     *
     * @param {string} new_text - new text for this PageNode
     */
    updateBodyText(new_text) {
        this.page_body_text = new_text;
    }

    /**
     *
     * @param {string} child_id - id of the ChildLink to remove from this PageNode.
     */
    removeLink(child_id) {
        this.page_children.delete[child_id];
    }

    /**
     *
     * @returns {Object} representing the contents of this PageNode.
     */
    toJSON() {
        let children = {};
        Object.keys(this.page_children).forEach(child => {
            children[child] = this.page_children[child].toJSON();
        });
        return {
            "page_id": this.page_id,
            "page_name": this.page_name,
            "page_body_text": this.page_body_text,
            "page_parents": this.page_parents,
            "page_children": children
        }
    }
}

class ChildLink {
    constructor(child_id, child_name, link_text, ) {
        this.child_id = child_id;
        this.child_name = child_name;
        this.link_text = link_text;
    }

    updateLinkText(link_text) {
        this.link_text = link_text;
        return
    }

    toJSON() {
        return {
            'child_id': this.child_id,
            'child_name': this.child_name,
            'link_text': this.link_text
        }
    }
}
