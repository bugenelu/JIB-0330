### Install following to run properly


import Parsing
import firebase_admin
from firebase_admin import firestore

firebase_app = firebase_admin.initialize_app(cred, {
	  'projectId': 'ga-knowledge-hub',
	})
db = firestore.client()

# TODO: Change the 'input' to use Firebase 
input_file_name = input("Enter input file:")
output_file_name = input("Enter output file:")
import_id = input("Enter input id:")

with open(input_file_name, 'r') as file:
    html_content = file.read()

data = Parsing.twine_parse(html_content, import_id)
collection_name = u'stories'
db.collection(collection_name).document(str(import_id)).set(data)
