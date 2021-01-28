### Install following to run properly
### pip install pprintpp
### pip install beautifulsoup4

import re
import json
from bs4 import BeautifulSoup
from pprint import pprint

INPUT_FILE_NAME = "demo-story.html"
OUTPUT_FILE_NAME = "data.json"

with open(INPUT_FILE_NAME, 'r') as file:
    html_content = file.read()

soup = BeautifulSoup(html_content, 'html.parser')
stories = soup.findAll('tw-passagedata')    # Finds all element with tag
data = {}

for story in stories:                       # Grab name of story, regex options and links to other stories
    attrib = story.attrs
    data[attrib['name']] = {'options': [], 'links': []}
    body = story.get_text()
    options = re.findall('\[\[(.*?)\]\]', body)

    for option in options:
        temp_split = option.split('->')
        data[attrib['name']]['options'].append(temp_split[0])
        data[attrib['name']]['links'].append(temp_split[1])


pprint(data)
json_object = json.dumps(data, indent=4)

with open(OUTPUT_FILE_NAME, 'w') as file:
    file.write(json_object)
