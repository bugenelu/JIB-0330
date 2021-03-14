## Make a class the tree, Class Tree, Class Node, Potentially Class Child Link

import json
from ChildLink import ChildLink
from PageNode import PageNode
import copy


class StoryGraph:

    def __init__(self, story_data=None):
        """ 
        Constructor for StoryGraph.
        :param story_data: a dictionary of the StoryGraph's contents read from the database
        ----------
        TODO: set unique identifier schema for stories in the database
        story_id (str): The story's unique identifier
        root_id (str): The page id of the root node
        root_name (str): The name of root node
        page_nodes (dict[PageNode]): dict of all PageNodes within StoryGraph
        """
        if story_data is not None:
            self.story_id = story_data['import-ID']
            self.story_name = story_data['story-name']
            self.root_id = story_data['root-ID']
            self.root_name = story_data['root-name']
            self.page_nodes = {}
            # self.page_nodes is a dict ['page-ID': PageNode] of PageNodes in this StoryGraph
            for page_node in story_data['page-nodes'].values():
                self.page_nodes[page_node['page-ID']] = PageNode(page_node)
            for page_node in self.page_nodes.values():
                for link in page_node.page_children:
                    self.page_nodes[link].page_parents.append(page_node.page_id)
        else:
            pass

    def getNodeList(self):
        return self.page_nodes

    def getInfo(self):
        """
        returns: A dictionary of import id, story name, root id and root name
        """
        return {"story_id": self.story_id, "root_id": self.root_id,
                "root-name": self.root_name, "story-name": self.story_name}

    def addNode(self, new_node, parent_node, link_text):
        if type(new_node) is not PageNode or type(parent_node) is not PageNode or type(link_text) is not str:
            return -1

        newID = new_node.page_id
        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[new_node.page_id] = copy.deepcopy(new_node)
        graph_copy.page_nodes[newID].page_parents.append(parent_node.page_id)

        parent_node = graph_copy.page_nodes[parent_node.page_id]
        parent_node.addLink(ChildLink({'link-text': link_text,
                                       'child-ID': new_node.page_id, 'child-name': new_node.page_name}))

        return graph_copy

    def addSubTree(self, subtree, parent_node, link_text):
        """

        :param subtree: StoryGraph object to append
        :param parent_node: the parent_node to receive the appended subtree as a child + descendants
        :param link_text: string representing text for the link from parent node to child
        :return: a copy of the graph with the subtree appended
        """
        if type(subtree) is not StoryGraph or type(parent_node) is not PageNode or type(link_text) is not str:
            return -1

        subtreeRoot = subtree.root_id
        subtree = copy.deepcopy(subtree)
        subtree.page_nodes[subtreeRoot].page_parents.append(parent_node.page_id)
        parent_graph = copy.deepcopy(self)

        parent_node = parent_graph.page_nodes[parent_node.page_id]

        for pageNode in subtree.getNodeList().values():
            if pageNode not in parent_graph.page_nodes:
                parent_graph.page_nodes[pageNode.page_id] = pageNode

        # Create link and apply

        parent_node.addLink(ChildLink({'link-text': link_text, 'child-ID': subtree.root_id,
                                       'child-name': subtree.root_name}))

        return parent_graph

    def updatePageNodeText(self, page_id, new_text):
        """

        :param page_id: string identifying the page to receive updated text
        :param new_text: string representing the new HTML body of the page to edit
        :return: a copy of the graph with the updated page copy
        """
        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[page_id].updateBodyText(new_text)

        return graph_copy

    def updatePageLinkText(self, page_id, link_id, new_text):
        """

        :param page_id: string identifying the page to receive a link update
        :param link_id: string identifying the link to edit
        :param new_text: the replacement text for the link
        :return: a copy of the graph with the updated link
        """
        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[page_id].page_children[link_id].updateLinkText(new_text)

        return graph_copy

    def toDict(self):
        """

        :return: a dictionary representing the story graph
        """
        page_nodes = {}
        for page_node in self.page_nodes.values():
            page_nodes[page_node.page_id] = page_node.toDict()
        data = {'import-ID': self.story_id, 'story-name': self.story_name, 'root-ID': self.root_id,
                'root-name': self.root_name, 'page-nodes': page_nodes}
        return data

    def graphToJson(self):
        """

        :return: a string representing the story graph
        """
        data = self.toDict()
        json_string = json.dumps(data, indent=4)
        return json_string

    # TODO: implement graphToFirestore() if toDict() is insufficient...
    def graphToFirestore(self):
        """
        currently redundant with self.toDict()
        :return: a dictionary representing this story graph
        """
        data = self.toDict()
        return data

    def getGraphSize(self):
        return len(self.page_nodes)

    def isEmpty(self):
        return len(self.page_nodes) == 0


''' End Class '''
