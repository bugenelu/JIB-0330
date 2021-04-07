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

const editor = new Editor();
editor.openStory(tree2);

var map = document.getElementById("map_canvas");
var button = document.getElementById("load_map_button");
var line_button = document.getElementById("add_line_button");

function add_line() {
    let essveegee = document.getElementById("line_haver");
    let a_line = document.createElementNS('http://www.w3.org/2000/svg','line');
    a_line.setAttribute("style", "stroke:rgb(255,0,0);stroke-width:2");
    a_line.setAttribute("x1","0");
    a_line.setAttribute("x2","1000");
    a_line.setAttribute("y1","0");
    a_line.setAttribute("y2","1000");
    essveegee.appendChild(a_line);
}

/**
 * Everything above the line is of dubious permanent value.
 */
 const tree_data = editor.getStoryPageTree("story2");
 const tree_layers = tree_data[0];
 const page_coords = {}
 const edge_set = tree_data[1];

 const layer_spacer = 1;
 const button_height = 2;
 const button_width = 12;
 const button_spacer = 1;

function load_map() {
    let max_width = 0;
    tree_layers.forEach(layer => {
        max_width = Math.max(max_width, layer.length);
    });

    let y_pos = 0;

    tree_layers.forEach(layer => {
        let layer_div = document.createElement('div');
        let attrib = "position:absolute;"
        attrib = attrib.concat("top:" + y_pos + "em;");
        layer_div.setAttribute("style", attrib);
        layer_div.setAttribute("class", "map_layer");
        // layer_div.innerHTML = "layer"
        let x_pos = 0;
        layer.forEach(page => {
            let page_div = document.createElement('button')
            
            let attrib = "position:absolute;";
            attrib = attrib.concat("left:"+ x_pos +"em;");
            attrib = attrib.concat("height:"+ button_height +"em;");
            attrib = attrib.concat("width:"+ button_width +"em;");

            page_div.setAttribute("style", attrib);
            page_div.setAttribute("class", "page_button");
            page_div.setAttribute("page_id", page["page_id"]);
            page_div.innerHTML = page["page_name"];
            layer_div.appendChild(page_div);

            page_coords[page.page_id] = {"x": x_pos, "y": y_pos};
            x_pos += button_width + button_spacer;
        });
        map.appendChild(layer_div);
        y_pos += button_height + layer_spacer;
    });

    let edges_div = document.createElement('div');
    edges_div.setAttribute("id", "edges_div");
    edges_div.setAttribute("style", 
        "height:"+ (y_pos + button_height)+ "em;"
        +"width:"+(max_width * button_width + (max_width - 1) * button_spacer)+"em;"
        + "position:absolute;"
        + "top:0;"
        + "left:0;"
    );
    let edges_render = document.createElementNS('http://www.w3.org/2000/svg','svg');
    // edges_render.setAttribute("id", "edges_svg");
    edges_render.setAttribute("height", (y_pos + button_height) + "em");
    edges_render.setAttribute("width", (max_width * button_width + (max_width - 1) * button_spacer) + "em");
    for (edge of edge_set) {
        add_edge(edge, edges_render, page_coords)
    }
    // edges_div.appendChild(edges_render);
    // document.body.appendChild(edges_render);
    map.appendChild(edges_render);
}

function add_edge(edge, e, coords) {
    l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute("z-index", -1);
    l.setAttribute("x1", coords[edge[0]]["x"] + "em");
    l.setAttribute("x2", coords[edge[1]]["x"] + "em");
    l.setAttribute("y1", coords[edge[0]]["y"] + button_height + "em");
    l.setAttribute("y2", coords[edge[1]]["y"] + "em");
    e.appendChild(l);
}