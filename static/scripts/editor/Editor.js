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

import { StoryGraph } from "./StoryGraph";

export class Editor {
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
        const new_graph = StoryGraph(story_data);
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
                "page_ndoes": {}
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