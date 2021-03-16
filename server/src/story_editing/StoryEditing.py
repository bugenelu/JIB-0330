## Read data.json into dictionary, basically create two StoryGraph, append them, output final json, and print results

import json
from story_editing.StoryGraph import StoryGraph
from story_editing.PageNode import PageNode
from story_editing.ChildLink import ChildLink

createdStories = 0

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
if type(newTree) is StoryGraph:
    createdStories += 1

with open('new_tree.json', 'w') as file:
    file.write(newTree.graphToJson())

# test edit PageNode text
# newTree.getNodeList()['1-3'].updateBodyText('My text has been updated cause Nick is cool - Matthew')
newPageText = "Matthew is just okay"
newTree_2 = newTree.updatePageNodeText('1-3', newPageText)
pageTextTest = False
if type(newTree_2) is StoryGraph:
    createdStories += 1
    if newTree_2.page_nodes['1-3'].page_body_text == newPageText:
        pageTextTest = True

# test edit Link
newLinkText = 'I want a better clown.'
newTree_3 = newTree.updatePageLinkText('0-1', '0-2', newLinkText)
linkTextTest = False
if type(newTree_3) is StoryGraph:
    createdStories += 1
    if newTree_3.page_nodes['0-1'].page_children['0-2'].link_text == newLinkText:
        linkTextTest = True

newNodeDict = {
    'page-ID': 10000,
    'page-name': 'mr. hello world page',
    'page-body-text': 'I am yoaur friendleeee new paaaage. Also I am drunk.',
    'page-children': {}
}

misterNewPage = PageNode(newNodeDict)
newNodeTestTree = newTree.addNode(misterNewPage, newTree.page_nodes['0-5'], 'go toa drunk node.')
createAddPageNodeTest = False
if type(newNodeTestTree) is StoryGraph:
    createdStories += 1
    if '0-5' in newNodeTestTree.page_nodes:
        if type(newNodeTestTree.page_nodes['0-5']) is PageNode:
            createAddPageNodeTest = True

expectedStoryCount = 4
print("Successfully created " + str(createdStories) + " out of " + str(expectedStoryCount) + " stories.")
if pageTextTest:
    print("Successfully updated page text.")
else:
    print("failed to update page text.")
if linkTextTest:
    print("Successfully updated link text.")
else:
    print("failed to update link text.")
if createAddPageNodeTest:
    print("Successfully created and added page node.")
else:
    print("failed to create and add page node.")
