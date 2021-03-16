import { PageNode } from "./PageNode";
import { ChildLink } from "./ChildLink";
import { clone } from ramda // for making deep copies

export class StoryGraph {
    /**
     * 
     * @param {Object} story_data - Object with { story_id, story_name, root_id, root_name, page_nodes{} }
     */
    constructor(story_data) {
        this.story_id = story_data.story_id;
        this.story_name = story_data.story_name;
        this.root_id = story_data.root_id;
        this.root_name = story_data.root_name;
        this.page_nodes = {};
        story_data.page_nodes.forEach(page => {
            this.page_nodes[page.page_id] = new PageNode(
                page.page_id, page.page_name, page.page_text,
                page.page_parents, page.page_children
            );
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
        const new_node = clone.clone(node_to_add);
        const new_id = new_node.page_id;
        const new_name = new_node.page_name;
        const new_graph = clone.clone(this);
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
        const new_subtree = clone.clone(subtree_to_add);
        const new_root_id = new_subtree.root_id;
        const new_root_name = new_subtree.root_name;
        const new_graph = clone.clone(this);
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
        const new_graph = clone.clone(this);
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
        const new_graph = clone.clone(this);
        new_graph.page_nodes[page_id].page_children[child_id].updateLinkText(new_text);
        return new_graph;
    }
    
    // TODO: deleteNode()
}