const Editor = require('./modules/Editor');

const tree1 = require('./dummy_data1.json');
const tree2 = require('./dummy_data2.json')
const database = 'database';

let p1_data = {
    "page_id": "P01",
    "page_name": "Page 1",
    "page_body_text": "This is Page 1.",
    "page_children": {}
};
let p2_data = {
    "page_id": "P02",
    "page_name": "Page 2",
    "page_body_text": "This is Page 2.",
    "page_children": {}
};
let p3_data = {
    "page_id": "P03",
    "page_name": "Page 3",
    "page_body_text": "This is Page 3.",
    "page_children": {}
};

let new_page = new Editor.PageNode(p1_data);

const editor = new Editor.Editor();

editor.openStory(tree1);
editor.openStory(tree2);
editor.newStory("test3", "3000");
editor.addNodeInGraph("test3", null, p1_data, null);
editor.addNodeInGraph("test3", "P01", p2_data, "linked p1 to p2");
editor.addNodeInGraph("test3", "P01", p3_data, "linked p1 to p3");

editor.editPageText("test3", "P01", "0000 1111");
let page_edit_test = editor.getStoryState("test3").page_nodes["P01"].page_body_text;
console.log("edit page text succeeded: " + (page_edit_test == "0000 1111"));

editor.editLinkText("test3", "P01", "P02", "0000 1111");
let page_link_test = editor.getStoryState("test3").page_nodes["P01"].page_children["P02"].link_text;
console.log("edit link text succeeded: " + (page_link_test == "0000 1111"));

editor.connectStoryGraphs("story1", "1000-7", "story2", "LINK CREATED");

/**
 * TODO: test deleteNodeFromGraph
 */