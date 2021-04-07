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
const tree_data = editor.getStoryPageTree("story2");


/**
 * Everything above the line is of dubious permanent value.
 */

function load_map(data = tree_data) {
    
    // tree data constants
    const tree_layers = tree_data[0];
    const page_coords = {}
    const edge_set = tree_data[1];
    
    // layout constants
    const layer_spacer = 50;
    const button_height = 30;
    const button_width = 120;
    const button_spacer = 25;
    
    // html elements
    let map = document.getElementById("map_canvas");
    let button = document.getElementById("load_map_button");

    // TODO: clear previous contents...
    // TODO: offset so root is centered on map_frame

    // tree measurements 
    let tree_depth = tree_layers.length; // in unit layers
    let max_width = 0; // in unit pages
    tree_layers.forEach(layer => {
        max_width = Math.max(max_width, layer.length);
    });

    let y_pos = 25; // root vertical offset

    // set map dimensions
    const y_dimension = y_pos * 2 + tree_depth * (button_height + layer_spacer) - layer_spacer;
    const x_dimension = max_width * (button_width + button_spacer) - button_spacer;
    let dimensions = "height:" + y_dimension + ";"
                     + "width:" + x_dimension +";";
    map.setAttribute("style", dimensions);

    // main loop to create buttons
    tree_layers.forEach(layer => {

        // make new layer
        let layer_div = document.createElement('div');
        let attrib = "position:absolute;"
        attrib = attrib.concat("top:" + y_pos + ";");
        layer_div.setAttribute("style", attrib);
        layer_div.setAttribute("class", "map_layer");
        const x_mid = (max_width * (button_width + button_spacer) - button_spacer) * .5;
        const num_pages = layer.length;
        const layer_width = (button_width + button_spacer) * num_pages - button_spacer;
        let x_pos = x_mid - (layer_width * .5);

        // add pages to layer
        layer.forEach(page => {

            // make and append page to layer
            let page_div = document.createElement('button')
            let attrib = "position:absolute;";
            attrib = attrib.concat("left:"+ x_pos +";");
            attrib = attrib.concat("height:"+ button_height +";");
            attrib = attrib.concat("width:"+ button_width +";");
            page_div.setAttribute("style", attrib);
            page_div.setAttribute("class", "page_button");
            page_div.setAttribute("page_id", page["page_id"]);
            page_div.innerHTML = page["page_name"];
            layer_div.appendChild(page_div);

            // record page position for edge creation
            page_coords[page.page_id] = {"x": x_pos, "y": y_pos};

            // update x_pos for next page
            x_pos += button_width + button_spacer;
        });

        // add layer to HTML
        map.appendChild(layer_div);
        // update y_pos for next layer
        y_pos += button_height + layer_spacer;
    });

    // create edges
    let edges_div = document.createElement('div');
    edges_div.setAttribute("id", "edges_div");
    edges_div.setAttribute("style", 
        "height:"+ (y_pos + button_height)+ ";"
        +"width:"+(max_width * button_width + (max_width - 1) * button_spacer)+";"
        + "position:absolute;"
        + "top:0;"
        + "left:0;"
    );
    let edges_render = document.createElementNS('http://www.w3.org/2000/svg','svg');
    edges_render.setAttribute("height", (y_pos + button_height));
    edges_render.setAttribute("width", (max_width * button_width + (max_width - 1) * button_spacer));
    for (edge of edge_set) {
        add_edge(edge, edges_render, page_coords)
    }

    // add edges to HTML
    map.appendChild(edges_render);

    // helper function for edge creation
    function add_edge(edge, e, coords) {
        let xr_offset = button_width * .5;
        let xc_offset = button_width * .5;
        let yr_offset = button_height * .9;
        let yc_offset = button_height * .1;
        l = document.createElementNS('http://www.w3.org/2000/svg','line');
        l.setAttribute("z-index", -1);
        l.setAttribute("x1", coords[edge[0]]["x"] + xr_offset);
        l.setAttribute("x2", coords[edge[1]]["x"] + xc_offset);
        l.setAttribute("y1", coords[edge[0]]["y"] + yr_offset);
        l.setAttribute("y2", coords[edge[1]]["y"] + yc_offset);
        e.appendChild(l);
    }
}
