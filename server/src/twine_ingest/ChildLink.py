class ChildLink:

    def __init__(self, link_text, child_node):
        """

        Parameters:
        -----------
        link_text (str): Tetx of the links to the child
        child_node (PageNode): The PageNode that the ChildLink ties to
        """
        self.link_text = link_text
        self.child_id = child_node.page_id
        self.child_name = child_node.page_name

    def updateLinkText(self, link_text):
        if type(link_text) is not str:
            return -1

        self.link_text = link_text
        return 0

''' End Class '''
