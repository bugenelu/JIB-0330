### Install following to run properly
### pip install pprintpp

import json
from pprint import pprint
import Parsing

# INPUT_FILE_NAME = "demo-story.html"
# OUTPUT_FILE_NAME = "data.json"
# IMPORT_ID = 0

input_file_name = input("Enter input file:")
output_file_name = input("Enter output file:")
import_id = input("Enter input id:")

with open(input_file_name, 'r') as file:
    html_content = file.read()

data = Parsing.twine_parse(html_content, import_id)

pprint(data)
json_object = json.dumps(data, indent=4)

with open(output_file_name, 'w') as file:
    file.write(json_object)
