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
# WE STOPPED HERE ON MONDAY
# TODO: Check the append subtree function to make sure we are passing the right parameters to involved constructors

# test edit PageNode text

# test edit Link

