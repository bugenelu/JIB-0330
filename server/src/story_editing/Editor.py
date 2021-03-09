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
        self.database = database
        self.openStories = {}

    # gets a list of stories for the Admin UI
    # TODO: Implement reading data
    # TODO: Implement formatting of read data
    def getDatabaseList(self, database=None):
        pass

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
        pass

    # TODO: test
    def connectTrees(self, parent_graph_id, child_graph_id, parent_node_id, link_text):
        """
        :param parent_graph_id: A string that is the story_id of the parent graph
        :param child_graph_id: A string that is the story_id of the graph to append
        :param parent_node_id: A string that is the page_id of the node that will receive the root of the child_graph as a child
        :param link_text: A string that is the new link text connecting the graphs

        :return: 0 on success, -1 on failure to create a new graph
        """
        parent_graph = self.openStories[parent_graph_id][-1]		# get latest version of parent graph
        child_graph = self.openStories[child_graph_id][-1]			# get latest version of child graph
        parent_node = parent_graph.page_nodes[parent_node_id]		# get the node using the node id
        new_graph = parent_graph.addSubtree(child_graph, parent_node, link_text)	# get a new graph which is a combination of child and parent graphs

        if new_graph == -1:
            return -1
        self.openStories[parent_graph_id].push(new_graph)			# push the latest graph to the deque
        return 0

    def addNode(self, graph_id, new_node, parent_node_id, link_text):
        """
        :param graph_id: A string that is the story_id of the parent graph
        :param new_node: A PageNode object to append as a child of the parent node in the graph
        :param parent_node_id: A string that is the page_id of the node that will receive the new node as a child
        :param link_text: A string that is the new link text connecting the graphs

        :return: 0 on success, -1 on failure to create a new graph
        """
        parent_graph = self.openStories[graph_id][-1]				# get latest version of parent graph
        parent_node = parent_graph.page_nodes[parent_node_id]		# get the node using the node id
        newGraph = parent_graph.addNode(new_node, parent_node, link_text)
        if newGraph == -1:
            return -1
        self.openStories[graph_id].push(newGraph)					# push the latest graph to the deque
        return 0

    # TODO: Define two page deletes-- one removes a single node. one removes a node and all of its descendants.
