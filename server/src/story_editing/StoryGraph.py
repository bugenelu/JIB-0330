## Make a class the tree, Class Tree, Class Node, Potentially Class Child Link

import json
from ChildLink import ChildLink
from PageNode import PageNode
import copy


class StoryGraph:

    def __init__(self, story_data=None):
        """ 
        Constructor for StoryGraph

        Parameter:
        ----------
        import_id (int): The specific import verison of Twine
        root_id (int): The page id of the root node
        root_name (str): The name of root node
        page_nodes (list(PageNode)): List of all PageNodes within StoryGraph
        """
        if story_data is not None:
            self.import_id = story_data['import-ID']
            self.story_name = story_data['story-name']
            self.root_id = story_data['root-ID']
            self.root_name = story_data['root-name']
            self.page_nodes = {}
            # self.page_nodes is a dict ['page-ID': PageNode] of PageNodes in this StoryGraph
            for page_node in story_data['page-nodes'].values():
                self.page_nodes[page_node['page-ID']] = PageNode(page_node)
        else:
            pass

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

        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[new_node.page_id] = copy.deepcopy(new_node)

        parent_node = graph_copy.page_nodes[parent_node.page_id]
        parent_node.addLink(ChildLink({'link-text': link_text,
            'child-ID': new_node.page_id, 'child-name': new_node.page_name}))

        return graph_copy

    def addSubTree(self, subtree, parent_node, link_text):
        if type(subtree) is not StoryGraph or type(parent_node) is not PageNode or type(link_text) is not str:
            return -1

        subtree = copy.deepcopy(subtree)
        parent_graph = copy.deepcopy(self)

        parent_node = parent_graph.page_nodes[parent_node.page_id]

        for pageNode in subtree.getNodeList().values():
            if pageNode not in parent_graph.page_nodes:
                # parent_graph.page_nodes.append(pageNode)
                # print(type(pageNode))
                # print(pageNode.page_id)
                parent_graph.page_nodes[pageNode.page_id] = pageNode
        
        # Create link and apply
        parent_node.addLink(ChildLink({'link-text': link_text, 'child-ID': subtree.root_id, 
            'child-name': subtree.root_name}))

        return parent_graph
    
    def updatePageNodeText(self, page_id, new_text):
        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[page_id].updateBodyText(new_text)

        return graph_copy

    def updatePageLinkText(self, page_id, link_id, new_text):
        graph_copy = copy.deepcopy(self)
        graph_copy.page_nodes[page_id].page_children[link_id].updateLinkText(new_text)

        return graph_copy

    def graphToJson(self):
        page_nodes = {}
        for page_node in self.page_nodes.values():
            page_nodes[page_node.page_id] = page_node.toDict()
        data = {'import-ID': self.import_id, 'story-name': self.story_name, 'root-ID': self.root_id,
                'root-name': self.root_name, 'page-nodes': page_nodes}
        json_string = json.dumps(data, indent=4)
        return json_string

    def getGraphSize(self):
        return len(self.page_nodes)

    def isEmpty(self):
        return len(self.page_nodes) == 0


''' End Class '''