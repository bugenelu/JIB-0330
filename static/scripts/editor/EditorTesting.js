const Editor = require('./modules/Editor');

const tree1 = require('./dummy_data1.json');
const tree2 = require('./dummy_data2.json')
const database = 'database';

story_graph = new Editor.StoryGraph(tree1);
editor = new Editor.Editor(database);

editor.openStory(tree1);
editor.openStory(tree2);
state_string = JSON.stringify(editor.getState());
console.log(state_string);
