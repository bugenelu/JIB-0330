export class ChildLink {
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