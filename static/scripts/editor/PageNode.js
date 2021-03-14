import { ChildLink } from "./ChildLink";

export class PageNode {
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

    addLink(child_id, child_name, link_text) {
        this.page_children.push(
            new ChildLink(child_id, child_name, link_text))
        return
    }

    updateBodyText(new_text) {
        this.page_text = new_text;
        return
    }

    removeLink(child_id) {
        this.page_children.delete[child_id];
    }

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