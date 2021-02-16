## Make a class the tree, Class Tree, Class Node, Potentially Class Child Link

import json
from ChildLink import ChildLink
from PageNode import PageNode


class StoryGraph:

    def __init__(self, story_data):
        """ 
        Constructor for StoryGraph

        Parameter:
        ----------
        import_id (int): The specific import verison of Twine
        root_id (int): The page id of the root node
        root_name (str): The name of root node
        page_nodes (list(PageNode)): List of all PageNodes within StoryGraph
        """
        self.import_id = story_data['import-ID']
        self.story_name = story_data['story-name']
        self.root_id = story_data['root-ID']
        self.root_name = story_data['root-name']
        self.page_nodes = {}
        # self.page_nodes is a dict ['page-ID': PageNode] of PageNodes in this StoryGraph
        for page_node in story_data['page-nodes'].values():
            self.page_nodes[page_node['page-ID']] = PageNode(page_node)

    def getNodeList(self):
        return self.page_nodes

    def getInfo(self):
        """
        returns: A dictionary of import id, story name, root id and root name
        """
        return {"import_id": self.import_id, "root_id": self.root_id, 
            "root-name": self.root_name, "story-name": self.story_name}

    def addNode(self, new_node, parent_node, link_text):
        if type(new_node) is not PageNode or type(parent_node) is not PageNode or type(link_text) is not str:
            return -1

        self.page_nodes.append(new_node)
        parent_node.addLink(ChildLink(link_text, new_node))

        return 0

    def addSubTree(self, subtree, parent_node, link_text):
        if type(subtree) is not StoryGraph or type(parent_node) is not PageNode or type(link_text) is not str:
            return -1

        for pageNode in subtree.getNodeList():
            if pageNode not in self.page_nodes:
                self.page_nodes.append(pageNode)
        
        parent_node.addLink(ChildLink(link_text, subtree.page_nodes[subtree.root_id]))

        return 0

    def graphToJson(self):
        page_nodes = {}
        for page_node in self.page_nodes.values():
            page_nodes[page_node.page_id] = page_node.toDict()
        data = {'import-ID': self.import_id, 'story-name': self.story_name, 'root-ID': self.root_id,
                'root-name': self.root_name, 'page-nodes': page_nodes}
        json_string = json.dumps(data)
        return json_string


''' End Class '''

