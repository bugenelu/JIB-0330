### Install following to run properly
### pip install pprintpp
### pip install beautifulsoup4

import re
import json
from bs4 import BeautifulSoup
from pprint import pprint
import TwineIngestUtils as Util

INPUT_FILE_NAME = "demo-story.html"
OUTPUT_FILE_NAME = "data.json"

with open(INPUT_FILE_NAME, 'r') as file:
    html_content = file.read()

soup = BeautifulSoup(html_content, 'html.parser')
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

importID = 0  # global import numbering system needed
storyName = str(importID) + '-' + storyattr['name']
rootID = str(importID) + '-' + storyattr['startnode']
rootName = str(importID) + '-' + rootName
"""
init import data with import-ID, root-ID, root-name, dictionary of page-nodes
    - root-ID is importID + '-' + pid of start page for this Twine story
    - root-name is importID + '-' + name of start page for this Twine story
"""
data = {'import-ID': importID, 'story-name': storyName, 'root-ID': rootID, 'root-name': rootName, 'page-nodes': {}}
id_dict = Util.make_id_dict(passages, importID)
for passage in passages:
    # create a pageNode
    newNode = Util.make_page_node(passage, importID, id_dict)
    data['page-nodes'][newNode['page-ID']] = newNode

pprint(data)
json_object = json.dumps(data, indent=4)

with open(OUTPUT_FILE_NAME, 'w') as file:
    file.write(json_object)
