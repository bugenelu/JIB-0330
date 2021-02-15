from ChildLink import ChildLink

class PageNode:

    def __init__(self, page_id, page_name, page_body_text, page_children):
        """
        Constructor for PageNode
        Parameters:
        -----------
        page_id (int): The id of the current page
        page_name (str): The name of the current page
        page_body_text (str): The text contained within in the page
        page_children (list(PageNode)): List of ChildLink Nodes
        """
        self.page_id = page_id
        self.page_name = page_name
        self.page_body_text = page_body_text
        self.page_children = page_children

    def addLink(self, newChildLink):
        if (type(newChildLink) is not ChildLink):
            return -1

        self.page_children.append(newChildLink)
        return 0
        
    def updateBodyText(self, newBodyText):
        if (type(newBodyText) is not str):
            return -1

        self.page_body_text = newBodyText
        return 0

    def getLinks(self):
        return self.page_children


''' End Class '''

