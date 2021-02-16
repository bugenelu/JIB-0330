class ChildLink:

    def __init__(self, child_data):
        """

        Parameters:
        -----------
        link_text (str): Text of the links to the child
        child_node (str): The unique page-id of the child node
        """
        self.link_text = child_data['link-text']
        self.child_id = child_data['child-ID']
        self.child_name = child_data['child-name']

    def updateLinkText(self, link_text):
        if type(link_text) is not str:
            return -1

        self.link_text = link_text
        return 0

    def toDict(self):
        return {'child-ID': self.child_id, 'child-name': self.child_name, 'link-text': self.link_text}


''' End Class '''
