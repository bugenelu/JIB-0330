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

class Editor {
    /**
     * 
     * @param {string} database - identifier for the database, to read and write stories
     */
    constructor() {
        this.openStories = {}; // An Object with a StoryStack for each open StoryGraph
    }

    /**
     * 
     * @param {Object} story_data - Object with data of story to add to openStories as a new stack
     */
    openStory(story_data) {
        const new_graph = new StoryGraph(story_data);
        if (new_graph.story_name in this.openStories) {
            this.openStories[new_graph.story_name].push(new_graph);
        } else {
            this.openStories[new_graph.story_name] = new StoryStack(new_graph);
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
                "root_id": '',
                "root_name": '',
                "page_nodes": {}
            }
            this.openStories[story_name] = new StoryStack(new StoryGraph(data));
        }
    }

    duplicateStory(story_name) {
        let stamp = Date.now().toString();
        let copy_name = story_name.concat(stamp.substr(stamp.length - 12));
        let data = this.openStories[story_name].getCurrent().toJSON();
        data.story_id = data.story_id.concat(stamp);
        data.story_name = copy_name;
        this.openStories[copy_name] = new StoryStack(new StoryGraph(data));
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
     * Connects two open StoryGraphs and adds the result to the parent's stack.
     * @param {string} parent_graph_name - name of the parent graph
     * @param {string} parent_node_id - page_id of the page to receive the subtree as descendants
     * @param {string} child_graph_name - name of the new subtree
     * @param {string} link_text - text for the new link from parent node to subtree
     */
    connectStoryGraphs(parent_graph_name, parent_node_id, child_graph_name, link_text) {
        let parent_graph = this.openStories[parent_graph_name].getCurrent();
        let child_graph = this.openStories[child_graph_name].getCurrent(); 
        let update = parent_graph.addSubtree(child_graph, parent_node_id, link_text);
        this.openStories[parent_graph_name].push(update);
    }

    /**
     * Adds a node to a graph and pushes the update graph to that graph's stack
     * @param {string} story_name - name of the StoryGraph to receive a new node
     * @param {string} parent_id - page_id of the page to receive the new node as a child
     * @param {Object} new_node_data - Object with the data to construct the new PageNode
     * @param {string} link_text - text for the link to the new node
     */
    addNodeInGraph(story_name, parent_id, new_node_data, link_text) {
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
    deleteNodeFromGraph(story_name, node_id) {
        let graph = this.openStories[story_name].getCurrent();
        let updates = graph.deleteNode(node_id);
        this.openStories[story_name].push(updates[0]);
        if (updates.length > 1) {
            updates.shift();
            updates.forEach(update => {
                this.openStories[update.story_name] = new StoryStack(update);
            });
        }
    }

    /**
     * Update the text of a page in a graph and add the updated version to that graph's stack
     * @param {string} story_name 
     * @param {string} page_id 
     * @param {string} new_text 
     */
    editPageText(story_name, page_id, new_text) {
        let current = this.openStories[story_name].getCurrent();
        let update = current.updatePageText(page_id, new_text);
        this.openStories[story_name].push(update);
    }

    /**
     * Update the text of a link in a graph and add the updated version to that graph's stack
     * @param {string} story_name 
     * @param {string} page_id 
     * @param {string} child_id 
     * @param {string} new_text 
     */
    editLinkText(story_name, page_id, child_id, new_text) {
        let current = this.openStories[story_name].getCurrent();
        let update = current.updatePageLink(page_id, child_id, new_text);
        this.openStories[story_name].push(update);
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
     * @returns {StoryGraph} that is the updated graph.
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

module.exports.Editor = Editor;
module.exports.StoryGraph = StoryGraph;
module.exports.PageNode = PageNode;
module.exports.ChildLink = ChildLink;