### pip install beautifulsoup4


from bs4 import BeautifulSoup
import story_editing.ParsingUtils as Util


def twine_parse(twine_data, import_id):
    soup = BeautifulSoup(twine_data, 'html.parser')
    storydata = soup.findAll('tw-storydata')
    # should throw an exception if no story found
    storyattr = storydata[0].attrs
    passages = soup.findAll('tw-passagedata')
    # should throw an exception if no passages found

    # find 'name' corresponding to passage 'pid' == story 'startnode'
    # Note: This could be O(1) if we assume first element of passages is root, but could be risky...
    rootName = ''
    for passage in passages:
        if passage['pid'] == storyattr['startnode']:
            rootName = passage['name']
            break

    storyName = str(import_id) + '-' + storyattr['name']
    rootID = str(import_id) + '-' + storyattr['startnode']
    rootName = str(import_id) + '-' + rootName
    """
    init import data with import-ID, root-ID, root-name, dictionary of page-nodes
        - root-ID is import_id + '-' + pid of start page for this Twine story
        - root-name is import_id + '-' + name of start page for this Twine story
    """
    data = {'story_id': import_id, 'story_name': storyName, 'root_id': rootID, 'root_name': rootName, 'page_nodes': {}}
    id_dict = Util.make_id_dict(passages, import_id)
    for passage in passages:
        # create a pageNode
        newNode = Util.make_page_node(passage, import_id, id_dict)
        data['page_nodes'][newNode['page_id']] = newNode

    return data
