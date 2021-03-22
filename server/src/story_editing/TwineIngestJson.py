### Install following to run properly
### pip install pprintpp

import json
from pprint import pprint
import Parsing
import sys


print(f'{sys.argv[1]}')

input_file_name = sys.argv[1]
output_file_name = sys.argv[2]
import_id = sys.argv[3]

with open(input_file_name, 'r') as file:
    html_content = file.read()

data = Parsing.twine_parse(html_content, import_id)

pprint(data)
json_object = json.dumps(data, indent=4)

with open(output_file_name, 'w') as file:
    file.write(json_object)
