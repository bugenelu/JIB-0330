### Install following to run properly
### pip install pprintpp

import json
from pprint import pprint
import Parsing

INPUT_FILE_NAME = "demo-story.html"
OUTPUT_FILE_NAME = "data.json"
IMPORT_ID = 0

with open(INPUT_FILE_NAME, 'r') as file:
    html_content = file.read()

data = Parsing.twine_parse(html_content, IMPORT_ID)

pprint(data)
json_object = json.dumps(data, indent=4)

with open(OUTPUT_FILE_NAME, 'w') as file:
    file.write(json_object)
