from ChildLink import ChildLink


class PageNode:

    def __init__(self, page_data):
        """
        Constructor for PageNode
        Parameters:
        -----------
        page_id (int): The id of the current page
        page_name (str): The name of the current page
        page_body_text (str): The text contained within in the page
        page_children (list(PageNode)): dict of ChildLink Nodes
        """
        self.page_id = page_data['page-ID']
        self.page_name = page_data['page-name']
        self.page_body_text = page_data['page-body-text']
        self.page_parents = []
        self.page_children = {}
        for child in page_data['page-children'].values():
            self.page_children[child['child-ID']] = ChildLink(child)

    def addLink(self, newChildLink):
        if type(newChildLink) is not ChildLink:
            return -1

        self.page_children[newChildLink.child_id] = newChildLink

        return 0

    def updateBodyText(self, newBodyText):
        if type(newBodyText) is not str:
            return -1

        self.page_body_text = newBodyText
        return 0

    def getLinks(self):
        return self.page_children

    def toDict(self):
        page_children = {}
        for child in self.page_children.values():
            page_children[child.child_id] = child.toDict()
        return {'page-ID': self.page_id, 'page-name': self.page_name, 'page-body-text': self.page_body_text,
                'page-children': page_children}

# TODO: Implement removeLink()


''' End Class '''
