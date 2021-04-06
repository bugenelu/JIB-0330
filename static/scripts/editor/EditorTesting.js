const tree1 = {
    "story_id": 1000,
    "story_name": "story1",
    "root_id": "1000-1",
    "root_name": "1000-START",
    "page_nodes": {
        "1000-1": {
            "page_id": "1000-1",
            "page_name": "1000-START",
            "page_body_text": "I want to tell a narrative story.",
            "page_children": {
                "1000-2": {
                    "child_name": "1000-CLOWN",
                    "link_text": "I want there to be a clown.",
                    "child_id": "1000-2"
                },
                "1000-3": {
                    "child_name": "1000-RACECAR",
                    "link_text": "I want there to be a racecar.",
                    "child_id": "1000-3"
                }
            }
        },
        "1000-2": {
            "page_id": "1000-2",
            "page_name": "1000-CLOWN",
            "page_body_text": "You are telling a story with a clown.\n",
            "page_children": {
                "1000-6": {
                    "child_name": "1000-WEIRD",
                    "link_text": "The clown is weird.",
                    "child_id": "1000-6"
                },
                "1000-7": {
                    "child_name": "1000-FUN",
                    "link_text": "The clown is fun.",
                    "child_id": "1000-7"
                }
            }
        },
        "1000-3": {
            "page_id": "1000-3",
            "page_name": "1000-RACECAR",
            "page_body_text": "You are telling a story with a racecar.\n",
            "page_children": {
                "1000-4": {
                    "child_name": "1000-RED",
                    "link_text": "It is red.",
                    "child_id": "1000-4"
                },
                "1000-5": {
                    "child_name": "1000-BLUE",
                    "link_text": "It is blue.",
                    "child_id": "1000-5"
                }
            }
        },
        "1000-4": {
            "page_id": "1000-4",
            "page_name": "1000-RED",
            "page_body_text": "The racecar is <span style=\"color: red\">red</span>",
            "page_children": {}
        },
        "1000-5": {
            "page_id": "1000-5",
            "page_name": "1000-BLUE",
            "page_body_text": "The racecar is <a style=\"color: blue\" href=\"https://www.step2.com/p/hot-wheels-toddler-to-twin-race-car-bed/\">blue</a>",
            "page_children": {}
        },
        "1000-6": {
            "page_id": "1000-6",
            "page_name": "1000-WEIRD",
            "page_body_text": "<a href=\"https://en.wikipedia.org/wiki/2016_clown_sightings\" target=\"_blank\">Weird...</a",
            "page_children": {}
        },
        "1000-7": {
            "page_id": "1000-7",
            "page_name": "1000-FUN",
            "page_body_text": "What a <a href=\"https://www.google.com/search?client=firefox-b-1-d&q=fun+clown\" target=\"_blank\">fun clown</a>",
            "page_children": {}
        }
    }
}

const tree2 = {
    "story_id": 2000,
    "story_name": "story2",
    "root_id": "2000-1",
    "root_name": "2000-START",
    "page_nodes": {
        "2000-1": {
            "page_id": "2000-1",
            "page_name": "2000-START",
            "page_body_text": "I am hungry.",
            "page_children": {
                "2000-2": {
                    "child_name": "2000-HAM",
                    "link_text": "I would like a ham sandwhich.",
                    "child_id": "2000-2"
                },
                "2000-3": {
                    "child_name": "2000-VEGETARIAN",
                    "link_text": "I am a vegetarian.",
                    "child_id": "2000-3"
                }
            }
        },
        "2000-2": {
            "page_id": "2000-2",
            "page_name": "2000-HAM",
            "page_body_text": "You are making a ham sandwhich.\n",
            "page_children": {
                "2000-6": {
                    "child_name": "2000-MAYONAISE",
                    "link_text": "...with mayonaise.",
                    "child_id": "2000-6"
                },
                "2000-7": {
                    "child_name": "2000-MUSTARD",
                    "link_text": "...with mustard.",
                    "child_id": "2000-7"
                }
            }
        },
        "2000-3": {
            "page_id": "2000-3",
            "page_name": "2000-VEGETARIAN",
            "page_body_text": "How about noodles and peanut sauce?\n",
            "page_children": {
                "2000-4": {
                    "child_name": "2000-GREAT",
                    "link_text": "That sounds great.",
                    "child_id": "2000-4"
                },
                "2000-5": {
                    "child_name": "2000-CHEESE",
                    "link_text": "I would rather eat cheese.",
                    "child_id": "2000-5"
                }
            }
        },
        "2000-4": {
            "page_id": "2000-4",
            "page_name": "2000-GREAT",
            "page_body_text": "It turns out it <em>was<em> great.",
            "page_children": {}
        },
        "2000-5": {
            "page_id": "2000-5",
            "page_name": "2000-CHEESE",
            "page_body_text": "The cheese is bleu.</a>",
            "page_children": {}
        },
        "2000-6": {
            "page_id": "2000-6",
            "page_name": "2000-MAYONAISE",
            "page_body_text": "DELIGHTFUL.",
            "page_children": {}
        },
        "2000-7": {
            "page_id": "2000-7",
            "page_name": "2000-MUSTARD",
            "page_body_text": "REMARKABLE.",
            "page_children": {}
        }
    }
}

const p1_data = {
    "page_id": "P01",
    "page_name": "Page 1",
    "page_body_text": "This is Page 1.",
    "page_children": {}
};
const p2_data = {
    "page_id": "P02",
    "page_name": "Page 2",
    "page_body_text": "This is Page 2.",
    "page_children": {}
};
const p3_data = {
    "page_id": "P03",
    "page_name": "Page 3",
    "page_body_text": "This is Page 3.",
    "page_children": {}
};

let new_page = new PageNode(p1_data);

const editor = new Editor();

editor.openStory(tree1);
editor.openStory(tree2);
editor.newStory("A New And Empty Story", "test3");
editor.addNodeInGraph("A New And Empty Story", null, "Mr. Root Node", null);
editor.addNodeInGraph("A New And Empty Story", "A New And Empty Story-1", "i yr child", "linked p1 to p2");
editor.addNodeInGraph("A New And Empty Story", "A New And Empty Story-1", "i yr other child", "linked p1 to p3");

editor.editPageText("A New And Empty Story", "A New And Empty Story-1", "0000 1111");
let page_edit_test = editor.getStoryState("A New And Empty Story").page_nodes["A New And Empty Story-1"].page_body_text;
console.log("edit page text succeeded: " + (page_edit_test == "0000 1111"));

editor.editLinkText("A New And Empty Story", "A New And Empty Story-1", "A New And Empty Story-2", "0000 1111");
let page_link_test = editor.getStoryState("A New And Empty Story").page_nodes["A New And Empty Story-1"].page_children["A New And Empty Story-2"].link_text;
console.log("edit link text succeeded: " + (page_link_test == "0000 1111"));

editor.connectStoryGraphs("story1", "1000-7", "story2", "LINK CREATED");

editor.deleteNodeFromGraph('story1', '1000-2');
editor.deleteNodeFromGraph('story1', '1000-1');

editor.duplicateStory('story1');

let page_tree = editor.getStoryPageTree('story2');
console.log(page_tree);

// let allstories = editor.getState();

// console.log("\n****final editor state: ");
// allstories.forEach(story => {
//     let data = JSON.stringify(story, null, 4);
//     console.log(data);
// });

// allstories.forEach( (story, div_results) => {
//     let el = document.getElementById("results");
//     let content = el.innerHTML;
//     content = content + "<div>" + JSON.stringify(story, null, 4) + "<\div>";
//     el.innerHTML = content;
// });

console.log('finished');
