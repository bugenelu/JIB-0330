"""
Welcome to the Editor. The Editor is responsible for:

    TODO: Are these tasks handled before the Editor is created?
    Reading the story content of a database.
    Rendering the content of a database for the Admin UI
        e.g. returning formatted lists of existing stories and story elements
    TODO: Implement the following...
    Creating StoryGraph objects from database or from UI input.
    Editing and combining open StoryGraph objects, which includes creating new
        PageNode and ChildLink objects as needed.
    Rendering the current state (and data) of open StoryGraph objects for the Admin UI
    Rendering StoryGraph objects to JSON for storage in a database

---
The Editor keeps a dictionary representing its open StoryGraph objects with 'story-name' keys.
The values are stacks of StoryGraphs with the top of the stack being the most recent version of
a particular graph identified by the key.

This is done to preserve undo ability while the Editor is open. Our expectation is that StoryGraphs
do not contain enough data to cause performance issues with this approach. We can revisit undo
handling if this assumption is wrong.

NOTE:
Be careful when implementing functions that are meant to *read* from StoryGraphs in stacks not to
*pop* a StoryGraph from the stack. This would cause the version to be lost.

"""

from collections import deque
from StoryGraph import StoryGraph


# TODO: how does the editor interact with the database?
class Editor:

    # TODO: Define fields of Editor...
    # TODO: Syntax for how the database is specified?
    # TODO: determine specific data the Editor needs in order to read from database
    def __init__(self, database=None):
        """
        :param database: a text string that lets this Editor find the database
        openStories: a dictionary of stacks of StoryGraph objects
        """
        database = None
        openStories = {}

    # gets a list of stories for the Admin UI
    # TODO: Implement reading data
    # TODO: Implement formatting of read data
    def getDatabaseList(self, database=None):
        storyList = []
        return storyList

    # TODO: how many StoryGraphs per stack?
    # TODO: how is the story data specified and read from the database?
    def openStory(self, story):
        """

        :param story: A formatted string from the database with story contents (metadata, pages, links, etc...)
        :return: 0 on success, -1 on failure
        """
        story_graph = StoryGraph(story)
        if story_graph.story_id not in self.openStories:
            story_stack = deque()
            story_stack.append(story_graph)
            self.openStories[story_graph.story_id] = story_stack
            return 0
        else:
            # story is already open and conflict resolution is needed.
            return -1

    # TODO: implement a function that saves a StoryGraph to a Database
    def saveStory(self, graph, database):
        return None

    # TODO: test
    def connectTrees(self, parent_graph, child_graph, parent_node, link_text):
        parentID = parent_graph.story_ID
        newGraph = parent_graph.addSubtree(child_graph, parent_node, link_text)
        if newGraph == -1:
            return -1
        self.openStories[parentID].push(newGraph)
        return 0

    def addNode(self, graph, new_node, parent_node, link_text):
        graphID = graph.story_ID
        newGraph = graph.addNode(new_node, parent_node, link_text)
        if newGraph == -1:
            return -1
        self.openStories[graphID].push(newGraph)
        return 0

    # TODO: Define two page deletes-- one removes a single node. one removes a node and all of its descendants.
