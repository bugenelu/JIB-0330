import { ChildLink } from "./ChildLink";

export class PageNode {
    /**
     * 
     * @param {string} page_id 
     * @param {string} page_name 
     * @param {string} page_text - 
     * @param {string[]} page_parents - list of page parent page_id strings
     * @param {Object[]} page_children - list of page child Objects with { child_id: string, child_name: string, link_text: string }
     */
    constructor(page_id, page_name, page_text, page_parents, page_children) {
        this.page_id = page_id;
        this.page_name = page_name;
        this.page_text = page_text;
        this.page_parents = page_parents;
        this.page_children = {};
        page_children.forEach(child => {
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
        children = {};
        for (child in self.page_children) {
            children[child.child_id] = child.toJSON();
        }
        return {
            page_id = this.page_id,
            page_name = this.page_name,
            page_text = this.page_text,
            page_parents = this.page_parents,
            page_children = children
        }
    }
}