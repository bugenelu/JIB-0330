import { PageNode } from "./PageNode";
import { ChildLink } from "./ChildLink";

export class StoryGraph {
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
}