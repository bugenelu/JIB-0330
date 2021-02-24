## Read data.json into dictionary, basically create two StoryGraph, append them, output final json, and print results

import json
from StoryGraph import StoryGraph
from PageNode import PageNode
from ChildLink import ChildLink

# test StoryGraph construction and output
input_file_name = 'data.json'
with open(input_file_name, 'r') as read_file:
    data = json.load(read_file)
story = StoryGraph(data)
json_string = story.graphToJson()

with open('subtree.json', 'r') as subtree_file:
    subtree_data = json.load(subtree_file)
subtree = StoryGraph(subtree_data)

# test append subtree
newTree = story.addSubTree(subtree, story.page_nodes['0-5'], 'Made a new link!!')

with open('new_tree.json', 'w') as file:
    file.write(newTree.graphToJson())

# test edit PageNode text
# newTree.getNodeList()['1-3'].updateBodyText('My text has been updated cause Nick is cool - Matthew')
newTree_2 = newTree.updatePageNodeText('1-3', 'Matthew is cool - Nick')

# test edit Link
newTree_3 = newTree.updatePageLinkText('0-1', '0-2',
    'I want there to be an even better clown')

# TODO: test add page node
# TODO: enumerate editor functions (mf)
# TODO: Create paper prototype editor ui