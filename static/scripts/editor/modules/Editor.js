/**
Welcome to the Editor. The Editor is responsible for:

    Creating StoryGraph objects from database or from UI input.
    Editing and combining open StoryGraph objects, which includes creating new
        PageNode and ChildLink objects as needed.
    Rendering the current state (and data) of open StoryGraph objects for the Admin UI
    Rendering StoryGraph objects to JSON for storage in a database

---
The Editor keeps an Object representing its open StoryGraphs with 'story_name' keys.
The values are stacks of StoryGraphs with the top of the stack being the most recent version of
a particular graph identified by the key.

This is done to preserve undo ability while the Editor is open. Our expectation is that StoryGraphs
do not contain enough data to cause performance issues with this approach. We can revisit undo
handling if this assumption is wrong.

NOTE:
Be careful when implementing functions that are meant to *read* from StoryGraphs in stacks not to
*pop* a StoryGraph from the stack. This would cause the version to be lost.

*/

/**
 * deep copy function based on https://javascript.plainenglish.io/how-to-deep-copy-objects-and-arrays-in-javascript-7c911359b089
 * @param {Object} inObject - the object to deep copy
 * @returns a deep copy of the object
 */
const deepCopy = (inObject) => {
    let outObject, value, key
  
    if (typeof inObject !== "object" || inObject === null) {
      return inObject // Return the value if inObject is not an object
    }
  
    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {}
  
    for (key in inObject) {
      value = inObject[key]
  
      // Recursively (deep) copy for nested objects, including arrays
      outObject[key] = deepCopy(value)
    }
  
    return outObject
  }

class Editor {
    /**
     * 
     * @param {string} database - identifier for the database, to read and write stories
     */
    constructor(database) {
        this.database = database;
        this.openStories = {};
    }

    /**
     * 
     * @param {Object} story_data - Object with data of story to add to openStories as a new stack
     */
    openStory(story_data) {
        const new_graph = new StoryGraph(story_data);
        if (new_graph.story_id in Object.keys(this.openStories)) {
            this.openStories[new_graph.story_name].push(new_graph);
        } else {
            this.openStories[new_graph.story_name] = [new_graph];
        }
    }

    /**
     * 
     * @param {string} story_name - string identifies story to close. deletes the story's stack from this.openStories
     * 
     * TODO: what about a check to see if the story has been saved so work isn't lost?
     */
    closeStory(story_name) {
        if (story_name in Object.keys(this.openStories)) {
            delete this.openStories[story_data];
        }
    }

    /**
     * 
     * @param {string} story_name - a name to identify the story
     */
    newStory(story_name) {
        if (!(story_name in Object.keys(this.openStories))) {
            let data = {
                "story_id": '',
                "story_name": story_name,
                "root_id": '',
                "root_name": '',
                "page_nodes": {}
            }
            this.openStories[story_name] = new StoryGraph(data);
        }
    }

    /**
     * Undoes the last edit to a StoryGraph
     * @param {string} story_name - identifes the story to step backwards 
     * @returns {StoryGraph} version that was removed from this.openStories. Could be saved in a redo cache.
     */
    undoLast(story_name) {
        return this.openStories[story_name].pop();
    }

    /**
     * saves the top of a StoryGraph stack to the database and returns the data for use in the UI.
     * @param {string} story_name - the story to save.
     * @returns {Object} of StoryGraph contents.
     */
    saveStory(story_name) {
        let story_graph = this.openStories[story_name];
        let story_data = story_graph[story_graph.length - 1].toJSON();
        // save story_data to database;
        return story_data;
    }

    connectStoryGraphs(parent_graph_name, parent_node_id, child_graph_id, link_text) {}

    addNodeInGraph(story_name, parent_id, new_node_data, link_text) {}

    deleteNodeFromGraph(story_name, node_id) {}

    getState() {
        const state = []
        Object.keys(this.openStories).forEach(stack => {
            let story_stack = this.openStories[stack];
            let data = story_stack[story_stack.length - 1].toJSON();
            state.push(data);
        });
        return state;
    }

    getStoryState(story_name) {
        const data = this.openStories[story_name].toJSON();
    }
}

class StoryGraph {
    /**
     * 
     * @param {Object} story_data - Object with { story_id, story_name, root_id, root_name, page_nodes{} }
     */
    constructor(story_data) {
        let story = JSON.parse(JSON.stringify(story_data));
        this.story_id = story_data.story_id;
        this.story_name = story_data.story_name;
        this.root_id = story_data.root_id;
        this.root_name = story_data.root_name;
        let pages = JSON.parse(JSON.stringify(story.page_nodes));
        this.page_nodes = {};
        Object.values(pages).forEach(page => {
            this.page_nodes[page.page_id] = new PageNode(page);
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
     * Takes a PageNode and appends it as a child of the 
     * designated parent in a deep copy of this StoryGraph.
     * @param {PageNode} node_to_add - the PageNode to append
     * @param {string} parent_id - the id of the parent PageNode for the new node
     * @param {string} link_text - the descriptive text of the link.
     * @returns {StoryGraph} that is the new graph
     */
    addNode(node_to_add, parent_id, link_text) {
        const new_node = deepCopy(node_to_add);
        const new_id = new_node.page_id;
        const new_name = new_node.page_name;
        const new_graph = deepCopy(this);
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
        const new_subtree = deepCopy(subtree_to_add);
        const new_root_id = new_subtree.root_id;
        const new_root_name = new_subtree.root_name;
        const new_graph = deepCopy(this);
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
     * @returns {StoryGraph} that is the updated graph.
     */
    updatePageText(page_id, new_text) {
        const new_graph = deepCopy(this);
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
        const new_graph = deepCopy(this);
        new_graph.page_nodes[page_id].page_children[child_id].updateLinkText(new_text);
        return new_graph;
    }
    
    // TODO: deleteNode()
}

class PageNode {
    /**
     * 
     * @param {string} page_id 
     * @param {string} page_name 
     * @param {string} page_text - 
     * @param {string[]} page_parents - list of page parent page_id strings
     * @param {Object[]} page_children - list of page child Objects with { child_id: string, child_name: string, link_text: string }
     */
    constructor(page_data) {
        let page = JSON.parse(JSON.stringify(page_data));
        this.page_id = page.page_id;
        this.page_name = page.page_name;
        this.page_text = page.page_text;
        this.page_parents = [];
        let children = Object.values(page.page_children);
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
     * @param {string} new_text - new text for this PageNode
     */
    updateBodyText(new_text) {
        this.page_text = new_text;
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
            "page_text": this.page_text,
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
        self.link_text = str(link_text);
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

module.exports.Editor = Editor;
module.exports.StoryGraph = StoryGraph;
module.exports.PageNode = PageNode;
module.exports.ChildLink = ChildLink;